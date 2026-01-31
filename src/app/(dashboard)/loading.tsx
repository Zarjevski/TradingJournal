import Spinner from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="w-full h-[92vh] flex justify-center items-center">
      <Spinner size="lg" />
    </div>
  );
}
