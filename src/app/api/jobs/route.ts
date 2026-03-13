import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const JOBS_FILE = path.join(process.cwd(), 'src/data/jobs.json');

// Helper to read jobs
const readJobs = () => {
    try {
        if (!fs.existsSync(JOBS_FILE)) return [];
        const data = fs.readFileSync(JOBS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

// Helper to write jobs
const writeJobs = (jobs: any) => {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
};

export async function GET() {
    const jobs = readJobs();
    return NextResponse.json(jobs);
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || (session.user as any).role !== "EMPLOYER") {
            return NextResponse.json({ error: "Unauthorized. Employer role required." }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, company, salary, requiredSkills } = body;

        if (!title || !description || !company || !requiredSkills) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const jobs = readJobs();
        const newJob = {
            id: `job_${Date.now()}`,
            title,
            description,
            company,
            salary: salary || "Competitive",
            requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map((s: string) => s.trim()),
            postedBy: session.user.email,
            createdAt: new Date().toISOString()
        };

        jobs.push(newJob);
        writeJobs(jobs);

        console.log(`[API_JOBS] New job posted: ${title} by ${company}`);
        return NextResponse.json(newJob);
    } catch (error: any) {
        console.error("[API_JOBS] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
