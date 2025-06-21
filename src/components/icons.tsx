import { Swords, Crown, User, Gamepad2, BrainCircuit, Flame, Bot, Shield, Skull, Baby, Award, Cat, Dog, Ghost, Rocket, Heart, Star, Wand2, Volume2, VolumeX } from "lucide-react";

export const Icons = {
    Logo: Swords,
    Crown: Crown,
    User: User,
    Gamepad: Gamepad2,
    Truth: BrainCircuit,
    Dare: Flame,
    AI: Bot,
    Kids: Baby,
    Teens: Shield,
    Adult: Skull,
    Award: Award,
    Wildcard: Wand2,
    Cat,
    Dog,
    Ghost,
    Rocket,
    Heart,
    Star,
    Volume2,
    VolumeX,
};

export const avatarIconKeys = ['Cat', 'Dog', 'Ghost', 'Rocket', 'Heart', 'Star', 'Gamepad', 'AI'] as const;
export type AvatarIconKey = typeof avatarIconKeys[number];
