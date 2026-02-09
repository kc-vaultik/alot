import { useState } from "react";
import { DropCreator, DropsList, DropDetail } from "../components/drops";
import { ProductsList, ProductEditor, InventoryTable, SupplierManager } from "../components/inventory";
import { PoolBalancesManager, EconomyConfigEditor, LedgerViewers, PricingManager } from "../components/economy";
import { UsersTable, UserDetailPanel, KYCReviewPanel } from "../components/users";
import { UserLookup, TransactionDebugger } from "../components/support";
import { GeneralSettings, NotificationSettings, SecuritySettings, EconomySettings, DisplaySettings } from "../components/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Bell, Shield, DollarSign, Palette } from "lucide-react";

export function AdminDrops() {
  const [selectedDropId, setSelectedDropId] = useState<string | null>(null);

  if (selectedDropId) {
    return (
      <div className="space-y-6">
        <DropDetail dropId={selectedDropId} onBack={() => setSelectedDropId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Drop Management</h2>
        <DropCreator />
      </div>
      <DropsList onViewDrop={setSelectedDropId} />
    </div>
  );
}

// Legacy alias
export const AdminRooms = AdminDrops;

export function AdminInventory() {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewingInventoryProductId, setViewingInventoryProductId] = useState<string | null>(null);

  if (viewingInventoryProductId) {
    return (
      <div className="space-y-6">
        <InventoryTable
          productId={viewingInventoryProductId}
          onBack={() => setViewingInventoryProductId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="products">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="inventory">All Inventory</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          </TabsList>
          <Button onClick={() => { setEditingProductId(null); setEditorOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <TabsContent value="products" className="mt-6">
          <ProductsList
            onEditProduct={(id) => { setEditingProductId(id); setEditorOpen(true); }}
            onViewInventory={setViewingInventoryProductId}
          />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <InventoryTable />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <SupplierManager />
        </TabsContent>
      </Tabs>

      <ProductEditor
        productId={editingProductId}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}
export function AdminEconomy() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="pools">
        <TabsList>
          <TabsTrigger value="pools">Pool Balances</TabsTrigger>
          <TabsTrigger value="config">Economy Config</TabsTrigger>
          <TabsTrigger value="ledgers">Ledgers</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>
        <TabsContent value="pools" className="mt-6">
          <PoolBalancesManager />
        </TabsContent>
        <TabsContent value="config" className="mt-6">
          <EconomyConfigEditor />
        </TabsContent>
        <TabsContent value="ledgers" className="mt-6">
          <LedgerViewers />
        </TabsContent>
        <TabsContent value="pricing" className="mt-6">
          <PricingManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
export function AdminUsers() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="kyc">KYC Review</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6">
          <UsersTable onSelectUser={setSelectedUserId} />
        </TabsContent>
        <TabsContent value="kyc" className="mt-6">
          <KYCReviewPanel />
        </TabsContent>
      </Tabs>
      {selectedUserId && (
        <UserDetailPanel userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
export function AdminSupport() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="lookup">
        <TabsList>
          <TabsTrigger value="lookup">User Lookup</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Debugger</TabsTrigger>
        </TabsList>
        <TabsContent value="lookup" className="mt-6">
          <UserLookup />
        </TabsContent>
        <TabsContent value="transactions" className="mt-6">
          <TransactionDebugger />
        </TabsContent>
      </Tabs>
    </div>
  );
}
export function AdminSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Configure admin panel and platform settings</p>
        </div>
      </div>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4 hidden sm:inline" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4 hidden sm:inline" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4 hidden sm:inline" />
            Security
          </TabsTrigger>
          <TabsTrigger value="economy" className="gap-2">
            <DollarSign className="h-4 w-4 hidden sm:inline" />
            Economy
          </TabsTrigger>
          <TabsTrigger value="display" className="gap-2">
            <Palette className="h-4 w-4 hidden sm:inline" />
            Display
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
        
        <TabsContent value="economy">
          <EconomySettings />
        </TabsContent>
        
        <TabsContent value="display">
          <DisplaySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
