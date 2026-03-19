// app/(store)/profile/page.tsx
'use client';

import { useState } from 'react';
import { useCreateCustomer } from '@/hooks/useCustomers';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin, Package, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import Maxwidth from '@/components/Maxwidth';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const createCustomer = useCreateCustomer();

  // Mock user data - In real app, this would come from auth context
  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    mobilePhone: '+1 234 567 8900',
    billStreet: '123 Main St',
    billCity: 'New York',
    billProvince: 'NY',
    billCountry: 'USA',
    billZipCode: '10001',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createCustomer.mutateAsync({
        name: userData.name,
        transDate: new Date().toLocaleDateString('en-GB').split('/').join('/'),
        mobilePhone: userData.mobilePhone,
        email: userData.email,
        billStreet: userData.billStreet,
        billCity: userData.billCity,
        billProvince: userData.billProvince,
        billCountry: userData.billCountry,
        billZipCode: userData.billZipCode,
      });

      if (result.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  return (
    <Maxwidth className="py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {userData.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold">{userData.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {userData.email}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="#profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile Information
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="/orders">
                  <Package className="mr-2 h-4 w-4" />
                  Order History
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="#wishlist">
                  <Heart className="mr-2 h-4 w-4" />
                  Wishlist
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="#addresses">
                  <MapPin className="mr-2 h-4 w-4" />
                  Addresses
                </a>
              </Button>
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList>
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={userData.name}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobilePhone">Phone Number</Label>
                        <Input
                          id="mobilePhone"
                          value={userData.mobilePhone}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="mb-4 font-medium">Billing Address</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="billStreet">Street Address</Label>
                          <Input
                            id="billStreet"
                            value={userData.billStreet}
                            onChange={handleChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billCity">City</Label>
                          <Input
                            id="billCity"
                            value={userData.billCity}
                            onChange={handleChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billProvince">State/Province</Label>
                          <Input
                            id="billProvince"
                            value={userData.billProvince}
                            onChange={handleChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billCountry">Country</Label>
                          <Input
                            id="billCountry"
                            value={userData.billCountry}
                            onChange={handleChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billZipCode">Postal Code</Label>
                          <Input
                            id="billZipCode"
                            value={userData.billZipCode}
                            onChange={handleChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createCustomer.isPending}
                        >
                          {createCustomer.isPending
                            ? 'Saving...'
                            : 'Save Changes'}
                        </Button>
                      </>
                    ) : (
                      <Button type="button" onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    )}
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your password and account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Update Password</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>
                    Customize your shopping experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Preferences settings coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recent Orders Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Your latest orders and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">Order #ORD-2024-00{i}</p>
                      <p className="text-sm text-muted-foreground">
                        Placed on Mar {i}, 2024
                      </p>
                    </div>
                    <Badge>Delivered</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <a href="/orders">View All Orders</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Maxwidth>
  );
}
