import RepoInput from "../components/RepoInput";

export default function Home() {
  return (
    <div className="flex flex-col bg-givizBackground text-givizBlack">
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4 text-center">
          See the data.
          <br />
          Understand the impact.
        </h1>
        <p className="text-givizBlack text-center text-base sm:text-lg max-w-xl mb-12">
          GIVIZ uses <span className="font-bold">AI</span> to detect roles,
          evaluate
          <br />
          communication, and surface collaboration patterns.
        </p>
        <RepoInput />
      </main>
    </div>
  );
}
