import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import algosdk from "algosdk";

const UNIVERSITY_DOMAINS = [".edu", ".ac.in"];
const UNIVERSITY_WHITELIST = ["admin@university.edu"];
const EMPLOYER_DOMAINS = [".corp", ".com", ".org"];

// Demo: Addresses that are authorized recruiters
const EMPLOYER_WHITELIST = ["Y6L3YTWYFQ3OS7VJMFWCYPR7H6BKVD33YGBP6OMRL2KQ5LA7IBSSXJDW7Y"];

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
                if (!credentials?.email || !credentials?.password) return null;

                const email = credentials.email.toLowerCase();
                const isWhitelisted = UNIVERSITY_WHITELIST.includes(email);
                const hasValidDomain = UNIVERSITY_DOMAINS.some(domain => email.endsWith(domain));

                if (!isWhitelisted && !hasValidDomain) {
                    throw new Error("Only recognized university domains (.edu, .ac.in) are allowed.");
                }

                const pwd = credentials.password.trim();
                if (pwd !== "admin123") {
                    throw new Error("Invalid institutional credentials.");
                }

                return {
                    id: email,
                    email: email,
                    name: "University Administrator",
                    role: "UNIVERSITY",
                } as any;
            }
        }),
        CredentialsProvider({
            id: "algorand-auth",
            name: "Algorand Wallet",
            credentials: {
                address: { label: "Address", type: "text" },
                signature: { label: "Signature", type: "text" },
                nonce: { label: "Nonce", type: "text" },
                requestedRole: { label: "Role", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.address || !credentials?.signature || !credentials?.nonce) return null;

                try {
                    const { address, signature, nonce, requestedRole } = credentials;

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
                        // Check if the address is an authorized recruiter
                        const isWhitelistedEmployer = EMPLOYER_WHITELIST.includes(address);

                        // If they specifically ask for EMPLOYER role and are whitelisted, grant it.
                        // Otherwise, default to STUDENT.
                        const finalRole = (requestedRole === "EMPLOYER" && isWhitelistedEmployer) ? "EMPLOYER" : "STUDENT";

                        return {
                            id: address,
                            name: `${finalRole} (${address.slice(0, 6)}...)`,
                            role: finalRole,
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
                token.role = (user as any).role?.toUpperCase() || "STUDENT";
                token.address = (user as any).address;
            }
            return token;
        },
        async session({ session, token }) {
            const userObj = {
                role: token.role || "STUDENT",
                address: token.address,
                name: (token.role === "EMPLOYER" ? "Senior Recruiter" : session.user?.name) || `User (${String(token.address).slice(0, 6)})`,
                email: session.user?.email || null,
            };

            (session as any).user = userObj;
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "complex_secret_placeholder_VishwasID",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
