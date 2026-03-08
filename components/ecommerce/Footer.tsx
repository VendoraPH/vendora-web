"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export function Footer() {
    return (
        <footer className="border-t" style={{ backgroundColor: '#110228', borderTopColor: '#7C3AED' }}>
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <Link href="/ecommerce/products" className="flex items-center">
                            <Image
                                src="/new-logo/website logo white.png"
                                alt="Vendora"
                                width={120}
                                height={36}
                                className="h-8 w-auto object-contain"
                            />
                        </Link>
                        <p className="text-sm leading-relaxed" style={{ color: '#a0a0c0' }}>
                            Your one-stop destination for premium fashion and lifestyle products.
                            We bring you the latest trends with quality assurance.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="#" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>
                                <Facebook className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>
                                <Instagram className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>
                                <Twitter className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>
                                <Youtube className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-white">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/ecommerce/about" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>About Us</Link>
                            </li>
                            <li>
                                <Link href="/ecommerce/contact" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>Contact Us</Link>
                            </li>
                            <li>
                                <Link href="/ecommerce/faq" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>FAQs</Link>
                            </li>
                            <li>
                                <Link href="/ecommerce/terms" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>Terms & Conditions</Link>
                            </li>
                            <li>
                                <Link href="/ecommerce/privacy" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>Privacy Policy</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-white">Customer Service</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/ecommerce/orders" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>Track Order</Link>
                            </li>
                            <li>
                                <Link href="/ecommerce/returns" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>Returns & Exchanges</Link>
                            </li>
                            <li>
                                <Link href="/ecommerce/shipping" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>Shipping Info</Link>
                            </li>
                            <li>
                                <Link href="/ecommerce/size-guide" className="transition-colors" style={{ color: '#a0a0c0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'} onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}>Size Guide</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-white">Stay Updated</h4>
                        <p className="text-sm" style={{ color: '#a0a0c0' }}>
                            Subscribe to our newsletter for exclusive deals and updates.
                        </p>
                        <div className="flex gap-2">
                            <Input placeholder="Enter your email" className="text-white placeholder:text-gray-400" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: '#7C3AED' }} />
                            <Button className="text-white" style={{ backgroundColor: '#7C3AED' }}>Subscribe</Button>
                        </div>
                        <div className="space-y-2 pt-4">
                            <div className="flex items-center gap-2 text-sm" style={{ color: '#a0a0c0' }}>
                                <MapPin className="w-4 h-4" style={{ color: '#7C3AED' }} />
                                <span>123 Fashion Street, NY 10001</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm" style={{ color: '#a0a0c0' }}>
                                <Phone className="w-4 h-4" style={{ color: '#7C3AED' }} />
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm" style={{ color: '#a0a0c0' }}>
                                <Mail className="w-4 h-4" style={{ color: '#7C3AED' }} />
                                <span>support@vendora.com</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="my-8" style={{ backgroundColor: '#7C3AED' }} />

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: '#a0a0c0' }}>
                    <p>&copy; {new Date().getFullYear()} Vendora. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <span>Visa</span>
                        <span>Mastercard</span>
                        <span>PayPal</span>
                        <span>Apple Pay</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
