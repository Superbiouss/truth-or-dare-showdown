"use client";

import type { GameResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Icons, AvatarIconKey } from "@/components/icons";
import { ArrowLeft, Crown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GameHistoryProps {
  history: GameResult[];
  onBack: () => void;
}

export function GameHistory({ history, onBack }: GameHistoryProps) {
  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Game History</CardTitle>
        <CardDescription>A record of your past battles.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <Icons.History className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">No Games Played Yet</p>
              <p>Come back here after you finish your first game!</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {history.map((game) => (
                <AccordionItem value={`game-${game.id}`} key={game.id}>
                  <AccordionTrigger>
                    <div className="flex justify-between items-center w-full pr-2">
                        <div>
                            <p className="font-semibold text-base">{game.date}</p>
                            <p className="text-sm text-muted-foreground font-normal">Winner: {game.winnerName}</p>
                        </div>
                        <Crown className="w-5 h-5 text-yellow-500" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {game.players.sort((a, b) => b.score - a.score).map((player) => {
                          const AvatarIcon = Icons[player.avatar as AvatarIconKey] ?? Icons.User;
                          return (
                            <TableRow key={player.name}>
                              <TableCell className="flex items-center gap-3">
                                <AvatarIcon className="w-6 h-6" />
                                {player.name}
                              </TableCell>
                              <TableCell className="text-right">{player.score}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button onClick={onBack} className="w-full" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Welcome
        </Button>
      </CardFooter>
    </Card>
  );
}
