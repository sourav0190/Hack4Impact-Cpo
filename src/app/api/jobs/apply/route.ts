import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { fetchUserAssetsWithDetails } from '@/lib/algorand';

const JOBS_FILE = path.join(process.cwd(), 'src/data/jobs.json');
const APPS_FILE = path.join(process.cwd(), 'src/data/applications.json');

const readData = (file: string) => {
    try {
        if (!fs.existsSync(file)) return [];
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) { return []; }
};

const writeData = (file: string, data: any) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || (session.user as any).role !== "STUDENT") {
            return NextResponse.json({ error: "Unauthorized. Student role required." }, { status: 401 });
        }

        const { jobId, studentAddress, name } = await request.json();

        if (!jobId || !studentAddress) {
            return NextResponse.json({ error: "Missing jobId or studentAddress" }, { status: 400 });
        }

        const jobs = readData(JOBS_FILE);
        const job = jobs.find((j: any) => j.id === jobId);

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // --- VERIFICATION LOGIC ---
        // Fetch student's actual on-chain assets with names
        const studentAssets = await fetchUserAssetsWithDetails(studentAddress);
        
        // Calculate score based on required skills
        // For simplicity, we match job's requiredSkills strings with asset names
        const required = job.requiredSkills.map((s: string) => s.toLowerCase());
        const owned = studentAssets.map((a: any) => (a.name || "").toLowerCase());

        const matches = required.filter((req: string) => 
            owned.some((own: string) => own.includes(req))
        );

        const score = required.length > 0 ? (matches.length / required.length) * 100 : 0;

        const apps = readData(APPS_FILE);
        
        // Prevent duplicate applications
        const exists = apps.find((a: any) => a.jobId === jobId && a.studentAddress === studentAddress);
        if (exists) return NextResponse.json({ error: "Already applied to this job" }, { status: 400 });

        const newApp = {
            id: `app_${Date.now()}`,
            jobId,
            jobTitle: job.title,
            company: job.company,
            studentAddress,
            studentName: name || session.user.name,
            skillMatchScore: Math.round(score),
            matchedSkills: matches,
            status: "PENDING",
            appliedAt: new Date().toISOString()
        };

        apps.push(newApp);
        writeData(APPS_FILE, apps);

        console.log(`[API_APPLY] Student ${studentAddress} applied to ${job.title}. Score: ${score}%`);
        return NextResponse.json(newApp);
    } catch (error: any) {
        console.error("[API_APPLY] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');
        const role = (session.user as any).role;

        const apps = readData(APPS_FILE);

        if (role === "EMPLOYER") {
            // Employers only see apps for their jobs or a specific job they posted
            const jobs = readData(JOBS_FILE);
            const myJobs = jobs.filter((j: any) => j.postedBy === session.user.email).map((j: any) => j.id);
            
            let filteredApps = apps.filter((a: any) => myJobs.includes(a.jobId));
            if (jobId) filteredApps = filteredApps.filter((a: any) => a.jobId === jobId);
            
            // Rank by score
            filteredApps.sort((a: any, b: any) => b.skillMatchScore - a.skillMatchScore);

            // Mask data for employers if not unlocked
            const maskedApps = filteredApps.map((a: any) => {
                if (a.isUnlocked) return a;
                return {
                    ...a,
                    studentName: `Candidate ${a.studentAddress.slice(-4)}`,
                    studentAddress: "Address Locked",
                    studentEmail: undefined,
                    studentPhone: undefined
                };
            });

            return NextResponse.json(maskedApps);
        } else {
            // Students see their own apps
            const studentApps = apps.filter((a: any) => a.studentAddress === (session.user as any).address);
            return NextResponse.json(studentApps);
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
