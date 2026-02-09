// Collect Room Background Component
// Renders the ambient background for the Collect Room with proper z-index isolation

export function CollectRoomBackground() {
  return (
    <>
      {/* Collect Room uses a dedicated dark backdrop (no landing image) */}
      <div className="fixed inset-0 bg-zinc-950 z-0 pointer-events-none" />

      {/* Subtle vignette for depth */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
    </>
  );
}
