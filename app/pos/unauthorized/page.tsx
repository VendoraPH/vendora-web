"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-red-100 rounded-full">
                            <ShieldAlert className="w-12 h-12 text-red-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription className="text-base">
                        You don't have permission to access this page
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                        <p className="text-sm text-amber-800">
                            <strong>Why am I seeing this?</strong>
                        </p>
                        <p className="text-sm text-amber-700 mt-2">
                            This page requires specific user permissions that your account doesn't have.
                            Please contact your administrator if you believe this is an error.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Button
                        onClick={() => router.back()}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        size="lg"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                    <Button
                        onClick={() => router.push('/pos/dashboard')}
                        variant="outline"
                        className="w-full"
                        size="lg"
                    >
                        Return to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
