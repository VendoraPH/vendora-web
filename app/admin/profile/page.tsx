"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/admin/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Save,
    Camera,
    Shield,
    Clock,
    MapPin,
    Calendar,
    Activity
} from "lucide-react"
import { toast } from "sonner"

export default function AdminProfilePage() {
    const [isSaving, setIsSaving] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Admin profile data
    const [profile, setProfile] = useState({
        name: "Admin User",
        email: "admin@vendora.com",
        role: "Super Admin",
        phone: "+63 912 345 6789",
        location: "Manila, Philippines",
        timezone: "Asia/Manila (UTC+8)",
        joinedDate: "January 15, 2024",
        lastLogin: "2 hours ago",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    // Recent activity
    const recentActivity = [
        { action: "Created new vendor", details: "Tech Store", time: "2 hours ago", type: "create" },
        { action: "Updated platform settings", details: "Changed timezone", time: "5 hours ago", type: "update" },
        { action: "Reviewed vendor application", details: "Fashion Hub", time: "1 day ago", type: "review" },
        { action: "Generated monthly report", details: "Revenue Report", time: "2 days ago", type: "report" },
        { action: "Suspended user account", details: "user@example.com", time: "3 days ago", type: "security" },
    ]

    const handleSaveProfile = async () => {
        setIsSaving(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast.success("Profile updated successfully")
        setIsSaving(false)
    }

    const handleChangePassword = async () => {
        if (!profile.currentPassword || !profile.newPassword) {
            toast.error("Please fill in all password fields")
            return
        }
        if (profile.newPassword !== profile.confirmPassword) {
            toast.error("Passwords do not match")
            return
        }
        if (profile.newPassword.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setIsSaving(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast.success("Password changed successfully")
        setProfile(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }))
        setIsSaving(false)
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Simulate upload
        await new Promise(resolve => setTimeout(resolve, 1500))
        toast.success("Profile photo updated successfully")
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "create":
                return <div className="w-2 h-2 rounded-full bg-green-500" />
            case "update":
                return <div className="w-2 h-2 rounded-full bg-blue-500" />
            case "review":
                return <div className="w-2 h-2 rounded-full bg-purple-500" />
            case "report":
                return <div className="w-2 h-2 rounded-full bg-orange-500" />
            case "security":
                return <div className="w-2 h-2 rounded-full bg-red-500" />
            default:
                return <div className="w-2 h-2 rounded-full bg-gray-500" />
        }
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your personal information and account settings
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Profile Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Photo & Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-purple-600" />
                                Profile Information
                            </CardTitle>
                            <CardDescription>
                                Update your photo and personal details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Profile Photo */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src="/placeholder-avatar.jpg" />
                                        <AvatarFallback className="bg-purple-100 text-purple-700 text-2xl font-bold">
                                            {profile.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <label
                                        htmlFor="photo-upload"
                                        className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full text-white cursor-pointer hover:bg-purple-700 transition-colors shadow-lg"
                                    >
                                        <Camera className="h-4 w-4" />
                                        <input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{profile.name}</h3>
                                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                                    <Badge className="mt-2 bg-purple-100 text-purple-700 hover:bg-purple-100">
                                        <Shield className="w-3 h-3 mr-1" />
                                        {profile.role}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            {/* Personal Information Form */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={profile.name}
                                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                        className="focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                            className="pl-10 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={profile.phone}
                                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                        className="focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="location"
                                            value={profile.location}
                                            onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                                            className="pl-10 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Change Password */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-purple-600" />
                                Change Password
                            </CardTitle>
                            <CardDescription>
                                Update your password to keep your account secure
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={profile.currentPassword}
                                        onChange={(e) => setProfile(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={profile.newPassword}
                                        onChange={(e) => setProfile(prev => ({ ...prev, newPassword: e.target.value }))}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={profile.confirmPassword}
                                            onChange={(e) => setProfile(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            placeholder="••••••••"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={isSaving}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    <Lock className="mr-2 h-4 w-4" />
                                    Update Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Account Info & Activity */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Account Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Account Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Member Since</p>
                                    <p className="font-medium">{profile.joinedDate}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Last Login</p>
                                    <p className="font-medium">{profile.lastLogin}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Timezone</p>
                                    <p className="font-medium text-sm">{profile.timezone}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Activity className="h-4 w-4 text-purple-600" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Your latest actions on the platform
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="mt-2">
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{activity.action}</p>
                                            <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Badge */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                <Shield className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-green-900">Account Secured</p>
                                    <p className="text-xs text-green-700">2FA enabled</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
