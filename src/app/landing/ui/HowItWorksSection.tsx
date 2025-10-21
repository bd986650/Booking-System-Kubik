import React from "react";
import Image from "next/image";

const HowItWorksSection: React.FC = () => {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <h2 className="relative z-10 text-4xl font-medium lg:text-5xl text-start">
                    Как работает наша система 
                </h2>

                <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
                    <div className="relative mb-6 sm:mb-0">
                        <div className="aspect-[76/59] relative rounded-2xl p-px">
                            <Image
                                src="/images/howitworks.png"
                                className="rounded-[15px] h-full w-full object-cover"
                                alt="Иллюстрация бронирования офиса"
                                width={1207}
                                height={929}
                            />
                        </div>
                    </div>

                    <div className="relative space-y-4">
                        <p className="text-muted-foreground">
                            Наша система позволяет <span className="font-bold text-blue-500">легко бронировать рабочие места</span> и управлять доступом сотрудников в офисе.
                        </p>
                        <p className="text-muted-foreground">
                            Используйте интерактивные карты для визуализации офисного пространства, выбирайте свободные места и создавайте комфортные условия для команды.
                        </p>

                        <div className="pt-6">
                            <blockquote className="border-l-4 pl-4">
                                <p>
                                    Использование нашей платформы для бронирования офисов стало настоящим прорывом в управлении рабочим пространством. Она сочетает простоту и функциональность, позволяя сотрудникам быстро и удобно резервировать места.
                                </p>

                                <cite className="block font-medium mt-6 space-y-3">
                                    <span className="font-bold text-blue-500">Никита Абрамкин</span>, CEO
                                </cite>
                            </blockquote>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HowItWorksSection;
