import { Button } from "@/shared/ui/buttons";
import Link from "next/link";

const LandingHeader: React.FC = () => {
  return (
    <header className="absolute top-6 left-0 right-0 flex justify-between items-center px-8 md:px-16 z-20">
      <span className="text-lg md:text-xl font-extrabold tracking-tight text-gray-900">
        
      </span>
      <div className="flex gap-4">
        <Button asChild variant="filled" color="blue">
          <Link href="/login">Вход</Link>
        </Button>
        <Button asChild variant="outline" color="blue">
          <Link href="/register">Регистрация</Link>
        </Button>
      </div>
    </header>
  );
};

export default LandingHeader;
