import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import fs from "fs";
import path from "path";

const studentsFilePath = path.join(process.cwd(), "src/data/students.json");

function getStudents() {
    if (!fs.existsSync(studentsFilePath)) {
        fs.writeFileSync(studentsFilePath, JSON.stringify([]));
        return [];
    }
    const data = fs.readFileSync(studentsFilePath, "utf8");
    return JSON.parse(data);
}

function saveStudents(students: any[]) {
    fs.writeFileSync(studentsFilePath, JSON.stringify(students, null, 2));
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "STUDENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const students = getStudents();
    const student = students.find((s: any) => s.address === (session.user as any).address);

    return NextResponse.json(student || { address: (session.user as any).address, needsSetup: true });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "STUDENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { email, phone, name } = body;

        if (!email || !phone) {
            return NextResponse.json({ error: "Contact details required" }, { status: 400 });
        }

        const students = getStudents();
        const studentIndex = students.findIndex((s: any) => s.address === (session.user as any).address);

        const newProfile = {
            address: (session.user as any).address,
            name: name || (session.user as any).name,
            email,
            phone,
            updatedAt: new Date().toISOString()
        };

        if (studentIndex > -1) {
            students[studentIndex] = newProfile;
        } else {
            students.push(newProfile);
        }

        saveStudents(students);
        return NextResponse.json({ message: "Profile updated", profile: newProfile });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
