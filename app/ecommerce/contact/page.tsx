"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    MessageSquare,
    Send,
    CheckCircle,
    HelpCircle
} from "lucide-react"

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        category: "",
        message: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 2000))

        setIsSubmitting(false)
        setIsSubmitted(true)

        // Reset form after 3 seconds
        setTimeout(() => {
            setIsSubmitted(false)
            setFormData({
                name: "",
                email: "",
                subject: "",
                category: "",
                message: ""
            })
        }, 3000)
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 lg:px-8 py-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Contact Us</h1>
                    <p className="text-lg text-gray-600">We're here to help. Reach out to us anytime.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 py-12">
                <div className="grid lg:grid-cols-3 gap-8 mb-12">
                    {/* Contact Info Cards */}
                    <Card className="p-6 border-2 border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all">
                        <div className="w-12 h-12 bg-[#7C3AED] rounded-xl flex items-center justify-center mb-4">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Email Us</h3>
                        <p className="text-gray-600 text-sm mb-3">Send us an email anytime</p>
                        <a href="mailto:support@shopsphere.com" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                            support@shopsphere.com
                        </a>
                    </Card>

                    <Card className="p-6 border-2 border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all">
                        <div className="w-12 h-12 bg-[#D946EF] rounded-xl flex items-center justify-center mb-4">
                            <Phone className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Call Us</h3>
                        <p className="text-gray-600 text-sm mb-3">Mon-Fri from 8am to 5pm</p>
                        <a href="tel:+1234567890" className="text-green-600 hover:text-green-700 font-semibold text-sm">
                            +1 (234) 567-890
                        </a>
                    </Card>

                    <Card className="p-6 border-2 border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Live Chat</h3>
                        <p className="text-gray-600 text-sm mb-3">Chat with our support team</p>
                        <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                            Start a conversation
                        </button>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Contact Form */}
                    <div className="lg:col-span-3">
                        <Card className="p-8 border-2 border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>

                            {isSubmitted ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                                    <p className="text-gray-600">We'll get back to you within 24 hours.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">
                                            Full Name *
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => handleChange("name", e.target.value)}
                                            required
                                            className="h-11 border-gray-200"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">
                                            Email Address *
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                            required
                                            className="h-11 border-gray-200"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <Label htmlFor="category" className="text-sm font-semibold text-gray-700 mb-2 block">
                                            Category *
                                        </Label>
                                        <Select value={formData.category} onValueChange={(value) => handleChange("category", value)} required>
                                            <SelectTrigger className="h-11 border-gray-200">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="general">General Inquiry</SelectItem>
                                                <SelectItem value="order">Order Support</SelectItem>
                                                <SelectItem value="vendor">Vendor Partnership</SelectItem>
                                                <SelectItem value="technical">Technical Issue</SelectItem>
                                                <SelectItem value="feedback">Feedback</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <Label htmlFor="subject" className="text-sm font-semibold text-gray-700 mb-2 block">
                                            Subject *
                                        </Label>
                                        <Input
                                            id="subject"
                                            placeholder="How can we help?"
                                            value={formData.subject}
                                            onChange={(e) => handleChange("subject", e.target.value)}
                                            required
                                            className="h-11 border-gray-200"
                                        />
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <Label htmlFor="message" className="text-sm font-semibold text-gray-700 mb-2 block">
                                            Message *
                                        </Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Tell us more about your inquiry..."
                                            value={formData.message}
                                            onChange={(e) => handleChange("message", e.target.value)}
                                            required
                                            rows={6}
                                            className="border-gray-200 resize-none"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full h-12 bg-[#D946EF] hover:bg-[#c026d3] text-white rounded-lg font-semibold"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </Card>
                    </div>

                    {/* Sidebar Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* FAQ Link */}
                        <Card className="p-6 border-2 border-gray-100 bg-purple-50">
                            <HelpCircle className="w-10 h-10 text-purple-600 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Have a quick question?</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Check out our FAQ section for instant answers to common questions.
                            </p>
                            <Button variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-100">
                                Visit FAQ
                            </Button>
                        </Card>

                        {/* Office Hours */}
                        <Card className="p-6 border-2 border-gray-100">
                            <div className="flex items-start gap-3 mb-4">
                                <Clock className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Support Hours</h3>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Monday - Friday:</span>
                                            <span className="font-semibold">8am - 8pm</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Saturday:</span>
                                            <span className="font-semibold">9am - 5pm</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Sunday:</span>
                                            <span className="font-semibold">Closed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Location */}
                        <Card className="p-6 border-2 border-gray-100">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Our Location</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        123 Commerce Street<br />
                                        San Francisco, CA 94102<br />
                                        United States
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Response Time */}
                        <Card className="p-6 border-2 border-green-100 bg-green-50">
                            <div className="text-center">
                                <div className="text-3xl font-black text-green-600 mb-2">~2 hours</div>
                                <div className="text-sm font-semibold text-gray-700">Average Response Time</div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
