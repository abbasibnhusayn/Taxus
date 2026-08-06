import { createClient } from "@/app/actions/clients";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-neutral-900">New Client</h1>
      <Card>
        <CardContent className="pt-6">
          <form action={createClient} className="space-y-4">
            <div>
              <Label htmlFor="legal_name">Legal name</Label>
              <Input id="legal_name" name="legal_name" required placeholder="Acme Textiles Pvt Ltd" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ntn">NTN</Label>
                <Input id="ntn" name="ntn" placeholder="1234567-8" />
              </div>
              <div>
                <Label htmlFor="taxpayer_type">Taxpayer type</Label>
                <Select id="taxpayer_type" name="taxpayer_type" defaultValue="individual">
                  <option value="individual">Individual</option>
                  <option value="aop">AOP</option>
                  <option value="company">Company</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Create client
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
