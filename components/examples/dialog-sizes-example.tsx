"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DialogSizesExample() {
  return (
    <div className="flex flex-wrap gap-4 p-8">
      {/* Small Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Small Dialog</Button>
        </DialogTrigger>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Small Modal</DialogTitle>
            <DialogDescription>
              This is a small dialog. Perfect for simple confirmations or quick actions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medium Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Medium Dialog</Button>
        </DialogTrigger>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Medium Modal</DialogTitle>
            <DialogDescription>
              This is a medium dialog. Good for forms with a few fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <input id="name" className="w-full rounded-md border px-3 py-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Large Dialog (Default) */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Large Dialog</Button>
        </DialogTrigger>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Large Modal (Default)</DialogTitle>
            <DialogDescription>
              This is a large dialog. This is the default size, great for most use cases.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Content goes here...</p>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* XL Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">XL Dialog</Button>
        </DialogTrigger>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Extra Large Modal</DialogTitle>
            <DialogDescription>
              This is an extra large dialog. Ideal for detailed forms or content-heavy modals.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>More content can fit here...</p>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2XL Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">2XL Dialog</Button>
        </DialogTrigger>
        <DialogContent size="2xl">
          <DialogHeader>
            <DialogTitle>2XL Modal</DialogTitle>
            <DialogDescription>
              Even larger for complex content and detailed information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Lots of content can fit here...</p>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3XL Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">3XL Dialog</Button>
        </DialogTrigger>
        <DialogContent size="3xl">
          <DialogHeader>
            <DialogTitle>3XL Modal</DialogTitle>
            <DialogDescription>
              Very large dialog for extensive content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Great for dashboards, tables, or detailed views...</p>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4XL Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">4XL Dialog</Button>
        </DialogTrigger>
        <DialogContent size="4xl">
          <DialogHeader>
            <DialogTitle>4XL Modal</DialogTitle>
            <DialogDescription>
              Huge dialog for very detailed content or wide tables.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Perfect for data tables or complex forms...</p>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5XL Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">5XL Dialog</Button>
        </DialogTrigger>
        <DialogContent size="5xl">
          <DialogHeader>
            <DialogTitle>5XL Modal</DialogTitle>
            <DialogDescription>
              Maximum size before fullscreen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Ultra-wide content area...</p>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Screen Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Full Screen Dialog</Button>
        </DialogTrigger>
        <DialogContent size="full">
          <DialogHeader>
            <DialogTitle>Full Screen Modal</DialogTitle>
            <DialogDescription>
              This dialog takes up 95% of the viewport with vertical scrolling.
              Perfect for complex forms, detailed product views, or POS interfaces.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Full screen content with automatic scrolling...</p>
            <div className="h-96 bg-muted rounded-md flex items-center justify-center">
              Large Content Area
            </div>
            <p>More content...</p>
            <div className="h-96 bg-muted rounded-md flex items-center justify-center">
              Another Large Section
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Example: Subscription Plans Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button>Subscription Plans (3XL)</Button>
        </DialogTrigger>
        <DialogContent size="3xl">
          <DialogHeader>
            <DialogTitle>Choose Your Subscription Plan</DialogTitle>
            <DialogDescription>
              Select the plan that best fits your business needs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
            {/* Basic Plan */}
            <div className="border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Basic</h3>
                <p className="text-3xl font-bold mt-2">$9.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ Up to 100 products</li>
                <li>✓ 1 POS terminal</li>
                <li>✓ Basic analytics</li>
                <li>✓ Email support</li>
              </ul>
              <Button className="w-full">Select Plan</Button>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-primary rounded-lg p-6 space-y-4 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                Popular
              </div>
              <div>
                <h3 className="font-semibold text-lg">Pro</h3>
                <p className="text-3xl font-bold mt-2">$29.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ Unlimited products</li>
                <li>✓ 5 POS terminals</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
                <li>✓ Inventory management</li>
              </ul>
              <Button className="w-full">Select Plan</Button>
            </div>

            {/* Enterprise Plan */}
            <div className="border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Enterprise</h3>
                <p className="text-3xl font-bold mt-2">$99.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ Unlimited everything</li>
                <li>✓ Unlimited POS terminals</li>
                <li>✓ Custom analytics</li>
                <li>✓ 24/7 phone support</li>
                <li>✓ Multi-location support</li>
                <li>✓ API access</li>
              </ul>
              <Button className="w-full">Contact Sales</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">Maybe Later</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * USAGE GUIDE:
 *
 * Available sizes:
 * - "sm"   - Small (max-w-sm: 384px)
 * - "md"   - Medium (max-w-md: 448px)
 * - "lg"   - Large (max-w-lg: 512px) - DEFAULT
 * - "xl"   - Extra Large (max-w-xl: 576px)
 * - "2xl"  - 2X Large (max-w-2xl: 672px)
 * - "3xl"  - 3X Large (max-w-3xl: 768px)
 * - "4xl"  - 4X Large (max-w-4xl: 896px)
 * - "5xl"  - 5X Large (max-w-5xl: 1024px)
 * - "full" - Full Screen (95vw with scroll)
 *
 * Basic usage:
 *
 * <Dialog>
 *   <DialogTrigger asChild>
 *     <Button>Open Dialog</Button>
 *   </DialogTrigger>
 *   <DialogContent size="xl">
 *     <DialogHeader>
 *       <DialogTitle>Your Title</DialogTitle>
 *       <DialogDescription>Your description</DialogDescription>
 *     </DialogHeader>
 *     <div>Your content here...</div>
 *     <DialogFooter>
 *       <Button>Action</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 *
 * Tips:
 * - Use "sm" for simple confirmations
 * - Use "md" or "lg" for forms with a few fields
 * - Use "xl" to "3xl" for detailed forms or subscription plans
 * - Use "4xl" or "5xl" for wide tables or complex layouts
 * - Use "full" for full-featured interfaces like POS screens
 */
