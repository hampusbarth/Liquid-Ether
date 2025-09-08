import Iridescence from "@/components/Iridescence";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0">
        <Iridescence
          className="w-full h-full"
          color={[1, 1, 1]}
          mouseReact={false}
          amplitude={0.12}
          speed={1.0}
        />
      </div>

      {/* Content on top */}
      <div className="relative z-10 flex h-screen items-center justify-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center leading-tight">
          GROW ONLINE
          <br />
          <span className="text-green-400">Look Great Doing It.</span>
        </h1>
      </div>
    </main>
  );
}