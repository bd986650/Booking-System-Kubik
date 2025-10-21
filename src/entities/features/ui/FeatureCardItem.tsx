import React from "react";
import { Feature } from '../model/featuresData';
import { Card, CardHeader, CardContent } from '@/shared/ui/Cards/FeatureCard';
import { CardDecorator } from '@/shared/ui/Cards/CardDecorator';

type FeatureCardItemProps = {
  feature: Feature;
};

export const FeatureCardItem: React.FC<FeatureCardItemProps> = ({ feature }) => (
  <Card className="group flex flex-col items-center text-center p-6 border border-gray-300 hover:border-blue-500 transition-colors duration-300">
    <CardHeader className="pb-3 flex flex-col items-center gap-2">
      <CardDecorator>{feature.icon}</CardDecorator>
      <h3 className="mt-6 font-semibold">{feature.title}</h3>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500 text-sm">{feature.description}</p>
    </CardContent>
  </Card>
);
