import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Requirements 1: Strict TypeScript Interface for the expected incoming request body
export interface ResumeRequest {
  resumeText: string;
}

// Requirements 2: Strict Interface for the Gemini API output
export interface Project {
  name: string;
  description: string;
}

export interface SanitizedProfile {
  title: string;
  skills: string[];
  experience: string;
  projects: Project[];
}

// Requirements 3: Enforce Google Gemini to return a structured JSON output
// Define the exact schema we want Gemini to output
const sanitizedProfileSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
      description: "Anonymous [Generic Job Title]",
    },
    skills: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
      description: "Core Technical Skills extracted from the resume",
    },
    experience: {
      type: SchemaType.STRING,
      description: "Description of total years and seniority level",
    },
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: {
            type: SchemaType.STRING,
            description: "Project Title",
          },
          description: {
            type: SchemaType.STRING,
            description: "Sanitized technical description of the project and impact",
          },
        },
        required: ["name", "description"],
      },
      description: "List of projects the candidate worked on",
    },
  },
  required: ["title", "skills", "experience", "projects"],
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing in environment variables");
      return NextResponse.json(
        { error: "Gemini API Key is not configured in .env.local" },
        { status: 500 }
      );
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Parse the request body with the ResumeRequest interface
    let requestBody: ResumeRequest;
    try {
      requestBody = await req.json() as ResumeRequest;
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON format in request body" },
        { status: 400 }
      );
    }

    const { resumeText } = requestBody;

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: "Resume text is required and must be a string" },
        { status: 400 }
      );
    }

    // Initialize the model with structured output configuration
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: sanitizedProfileSchema,
      },
    });

    const systemPrompt = `
      Act as a strict, unbiased HR parser for a feature called 'BlindHire'. 
      Your goal is to remove ALL human bias from a resume by stripping Personally Identifiable Information (PII).
      
      CRITICAL RULES:
      - REMOVE: Names, Email, Phone, Social Media Links, Gender, Specific Locations (City/Country), and exact birth dates.
      - ANONYMIZE: Replace specific University names with "Tier-1 University" or "University", and specific Company names with "Tech Company", "Startup", or "Enterprise".
      - EXTRACT: Core Technical Skills, Years of Experience, Project Descriptions, and technical metrics/achievements.
      
      You must follow the provided JSON schema strictly. Do not deviate.
    `;

    const result = await model.generateContent([
      systemPrompt,
      `RESUME TEXT TO SANITIZE:\n${resumeText}`
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Requirements 4: Robust try-catch error handling
    try {
      // Since we enforced JSON output, this should parse directly into our structure
      const jsonResponse = JSON.parse(text) as SanitizedProfile;
      return NextResponse.json(jsonResponse, { status: 200 });
    } catch (parseError) {
      console.error("JSON Parse Error. Raw Text:", text, parseError);
      return NextResponse.json(
        { error: "AI response violated JSON schema structure" },
        { status: 502 } // Bad Gateway - upstream AI service returned invalid format
      );
    }

  } catch (error: Error | unknown) {
    console.error("Gemini API Error details:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    return NextResponse.json(
      { 
        error: "Internal Server Error occurred during resume sanitization",
        details: errorMessage
      }, 
      { status: 500 }
    );
  }
}
