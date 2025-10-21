import Link from "next/link";
import React from "react";

const Footer: React.FC = () => {
    const base =
        "text-blue-500 border-b-2 border-transparent hover:border-blue-500 transition-all duration-300";

    return (
        <footer className="bg-white py-12 border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-500">&copy; 2025 Кубик. Все права защищены.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <Link
                        href="https://github.com/bd986650/Booking-System"
                        target="_blank"
                        className={base}
                    >
                        Github
                    </Link>
                    <Link
                        href="https://www.linkedin.com/in/danil-belov-1b6034236/"
                        target="_blank"
                        className={base}
                    >
                        LinkedIn
                    </Link>
                    <Link
                        href="https://t.me/chouqxx"
                        target="_blank"
                        className={base}
                    >
                        Telegram
                    </Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
