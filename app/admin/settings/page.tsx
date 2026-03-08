"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/admin/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    User,
    Building2,
    Bell,
    Shield,
    Palette,
    Globe,
    Save,
    Mail,
    Lock,
    Eye,
    EyeOff
} from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Platform settings state
    const [platformSettings, setPlatformSettings] = useState({
        siteName: "Vendora",
        supportEmail: "support@vendora.com",
        timezone: "Asia/Manila",
        currency: "PHP",
        maintenanceMode: false,
        allowRegistrations: true,
    })

    // Notification preferences
    const [notificationPrefs, setNotificationPrefs] = useState({
        emailNotifications: true,
        vendorAlerts: true,
        orderAlerts: true,
        paymentAlerts: true,
        weeklyReports: true,
    })

    // Admin profile
    const [adminProfile, setAdminProfile] = useState({
        name: "Admin User",
        email: "admin@vendora.com",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    const handleSaveGeneral = async () => {
        setIsSaving(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast.success("General settings saved successfully")
        setIsSaving(false)
    }

    const handleSaveProfile = async () => {
        if (adminProfile.newPassword && adminProfile.newPassword !== adminProfile.confirmPassword) {
            toast.error("Passwords do not match")
            return
        }
        setIsSaving(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast.success("Profile updated successfully")
        setAdminProfile(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }))
        setIsSaving(false)
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage platform settings and your admin profile
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-purple-600" />
                                General Settings
                            </CardTitle>
                            <CardDescription>
                                Configure basic platform settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="siteName">Platform Name</Label>
                                    <Input
                                        id="siteName"
                                        value={platformSettings.siteName}
                                        onChange={(e) => setPlatformSettings(prev => ({ ...prev, siteName: e.target.value }))}
                                        className="focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="supportEmail">Support Email</Label>
                                    <Input
                                        id="supportEmail"
                                        type="email"
                                        value={platformSettings.supportEmail}
                                        onChange={(e) => setPlatformSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                        className="focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select
                                        value={platformSettings.timezone}
                                        onValueChange={(value) => setPlatformSettings(prev => ({ ...prev, timezone: value }))}
                                    >
                                        <SelectTrigger id="timezone">
                                            <Globe className="mr-2 h-4 w-4" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Asia/Manila">Asia/Manila (UTC+8)</SelectItem>
                                            <SelectItem value="Asia/Singapore">Asia/Singapore (UTC+8)</SelectItem>
                                            <SelectItem value="America/New_York">America/New York (UTC-5)</SelectItem>
                                            <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select
                                        value={platformSettings.currency}
                                        onValueChange={(value) => setPlatformSettings(prev => ({ ...prev, currency: value }))}
                                    >
                                        <SelectTrigger id="currency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PHP">PHP (₱)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="SGD">SGD (S$)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="maintenance">Maintenance Mode</Label>
                                        <p className="text-sm text-muted-foreground">Temporarily disable the platform</p>
                                    </div>
                                    <Switch
                                        id="maintenance"
                                        checked={platformSettings.maintenanceMode}
                                        onCheckedChange={(checked) => setPlatformSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="registrations">Allow Registrations</Label>
                                        <p className="text-sm text-muted-foreground">Allow new vendors to register</p>
                                    </div>
                                    <Switch
                                        id="registrations"
                                        checked={platformSettings.allowRegistrations}
                                        onCheckedChange={(checked) => setPlatformSettings(prev => ({ ...prev, allowRegistrations: checked }))}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveGeneral}
                                    disabled={isSaving}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Profile */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-purple-600" />
                                Admin Profile
                            </CardTitle>
                            <CardDescription>
                                Update your account information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="adminName">Full Name</Label>
                                    <Input
                                        id="adminName"
                                        value={adminProfile.name}
                                        onChange={(e) => setAdminProfile(prev => ({ ...prev, name: e.target.value }))}
                                        className="focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="adminEmail">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="adminEmail"
                                            type="email"
                                            value={adminProfile.email}
                                            onChange={(e) => setAdminProfile(prev => ({ ...prev, email: e.target.value }))}
                                            className="pl-10 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <Label className="flex items-center gap-2 text-base font-semibold mb-4">
                                    <Lock className="h-4 w-4" />
                                    Change Password
                                </Label>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="currentPassword"
                                                type={showPassword ? "text" : "password"}
                                                value={adminProfile.currentPassword}
                                                onChange={(e) => setAdminProfile(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                placeholder="••••••••"
                                                className="pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <Input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={adminProfile.newPassword}
                                            onChange={(e) => setAdminProfile(prev => ({ ...prev, newPassword: e.target.value }))}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showPassword ? "text" : "password"}
                                                value={adminProfile.confirmPassword}
                                                onChange={(e) => setAdminProfile(prev => ({ ...prev, confirmPassword: e.target.value }))}
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
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Update Profile
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Notification Preferences */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-purple-600" />
                                Email Notifications
                            </CardTitle>
                            <CardDescription>
                                Configure email alert preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="emailNotif">Email Notifications</Label>
                                <Switch
                                    id="emailNotif"
                                    checked={notificationPrefs.emailNotifications}
                                    onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, emailNotifications: checked }))}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <Label htmlFor="vendorAlerts">Vendor Alerts</Label>
                                <Switch
                                    id="vendorAlerts"
                                    checked={notificationPrefs.vendorAlerts}
                                    onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, vendorAlerts: checked }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="orderAlerts">Order Alerts</Label>
                                <Switch
                                    id="orderAlerts"
                                    checked={notificationPrefs.orderAlerts}
                                    onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, orderAlerts: checked }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="paymentAlerts">Payment Alerts</Label>
                                <Switch
                                    id="paymentAlerts"
                                    checked={notificationPrefs.paymentAlerts}
                                    onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, paymentAlerts: checked }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="weeklyReports">Weekly Reports</Label>
                                <Switch
                                    id="weeklyReports"
                                    checked={notificationPrefs.weeklyReports}
                                    onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, weeklyReports: checked }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-purple-600" />
                                Security
                            </CardTitle>
                            <CardDescription>
                                Account security options
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Two-Factor Auth</Label>
                                    <p className="text-xs text-muted-foreground">Enhanced security</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Session Timeout</Label>
                                    <p className="text-xs text-muted-foreground">Auto logout after 30 min</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Login Alerts</Label>
                                    <p className="text-xs text-muted-foreground">Email on new logins</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5 text-purple-600" />
                                Appearance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Dark Mode</Label>
                                    <p className="text-xs text-muted-foreground">Toggle dark theme</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
