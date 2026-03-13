import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const role = token?.role;
        const path = req.nextUrl.pathname;

        // Route Protection Logic
        if (path.startsWith("/issue") && role !== "UNIVERSITY") {
            return NextResponse.redirect(new URL("/login?error=UnauthorizedUniversity", req.url));
        }

        if (path.startsWith("/dashboard") && role !== "STUDENT") {
            return NextResponse.redirect(new URL("/login?error=UnauthorizedStudent", req.url));
        }

        if (path.startsWith("/recruit") && role !== "EMPLOYER") {
            return NextResponse.redirect(new URL("/login?error=UnauthorizedEmployer", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: ["/issue/:path*", "/dashboard/:path*", "/recruit/:path*"],
};
