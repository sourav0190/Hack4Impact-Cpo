import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import algosdk from "algosdk";

const UNIVERSITY_DOMAINS = [".edu", ".ac.in"];
const UNIVERSITY_WHITELIST = ["admin@university.edu"];
const EMPLOYER_DOMAINS = [".corp", ".com", ".org"];

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "employer_credentials",
            name: "Employer Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                
                const email = credentials.email.toLowerCase();
                const hasValidDomain = EMPLOYER_DOMAINS.some(domain => email.endsWith(domain));

                if (!hasValidDomain) {
                    throw new Error("Invalid employer domain.");
                }

                // Demo password logic
                if (credentials.password !== "employer123") {
                    throw new Error("Invalid employer credentials.");
                }

                return {
                    id: email,
                    email: email,
                    name: "Corporate Recruiter",
                    role: "EMPLOYER",
                } as any;
            }
        }),
        CredentialsProvider({
            id: "university_credentials",
            name: "University Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("Auth Attempt:", credentials?.email);
                if (!credentials?.email || !credentials?.password) {
                    console.log("Missing credentials");
                    return null;
                }

                const email = credentials.email.toLowerCase();
                const isWhitelisted = UNIVERSITY_WHITELIST.includes(email);
                const hasValidDomain = UNIVERSITY_DOMAINS.some(domain => email.endsWith(domain));

                if (!isWhitelisted && !hasValidDomain) {
                    throw new Error("Only recognized university domains (.edu, .ac.in) are allowed.");
                }

                // In a real app, verify password against DB. Hardcoded for demo:
                const pwd = credentials.password.trim();
                if (pwd !== "admin123") {
                    throw new Error("Invalid institutional credentials.");
                }
                console.log("Auth Success:", email);
                return {
                    id: email,
                    email: email,
                    name: "University Administrator",
                    role: "UNIVERSITY",
                } as any;
            }
        }),
        CredentialsProvider({
            id: "student-algorand",
            name: "Student Algorand",
            credentials: {
                address: { label: "Address", type: "text" },
                signature: { label: "Signature", type: "text" },
                nonce: { label: "Nonce", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.address || !credentials?.signature || !credentials?.nonce) return null;

                try {
                    const { address, signature, nonce } = credentials;
                    
                    // For demo/testing, allow a placeholder signature
                    const isDemo = signature === "demo_sig_verified_by_backend";
                    let isValid = false;

                    if (isDemo) {
                        isValid = true;
                    } else {
                        const signatureBytes = new Uint8Array(Buffer.from(signature, 'hex'));
                        const nonceBytes = new Uint8Array(Buffer.from(nonce, 'utf-8'));
                        isValid = algosdk.verifyBytes(nonceBytes, signatureBytes, address);
                    }

                    if (isValid) {
                        return {
                            id: address,
                            name: `Student (${address.slice(0, 6)}...)`,
                            role: "STUDENT",
                            address: address
                        } as any;
                    }
                } catch (error) {
                    console.error("SIWA Verification Error:", error);
                }
                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.address = (user as any).address;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).address = token.address;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "complex_secret_placeholder_veridegree",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
