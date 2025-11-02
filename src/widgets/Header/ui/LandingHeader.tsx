import { Button } from "@/shared/ui/Buttons";
import Link from "next/link";
import { LogoIcon } from "@/shared/ui/Branding";

const LandingHeader: React.FC = () => {
    return (
        <header className="absolute top-6 left-0 right-0 flex justify-between items-center px-8 md:px-16 z-20">
            <LogoIcon/>
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
