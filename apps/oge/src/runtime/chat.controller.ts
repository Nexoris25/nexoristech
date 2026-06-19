/**
 * The grounded chat endpoint (PRD 10.5). Streams the answer to the browser over server-sent
 * events: a meta line, the sources, the answer tokens, an optional handoff, then done. Any failure
 * becomes a plain notice, never a stack trace or status code.
 */
import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
// NestJS reads the constructor parameter type from emitted metadata, so OgeService must be a
// value import, not a type-only one.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { OgeService } from "./oge.service.js";
import type { ChatMessage } from "../providers/generation.js";

interface ChatBody {
  message?: string;
  sessionId?: string;
  history?: ChatMessage[];
}

@Controller()
export class ChatController {
  constructor(private readonly oge: OgeService) {}

  @Post("chat")
  async chat(
    @Body() body: ChatBody,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const send = (event: unknown): void => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const message = (body.message ?? "").toString();
    if (message.trim().length === 0) {
      send({ type: "notice", message: "Please type a question." });
      send({ type: "done" });
      res.end();
      return;
    }

    const ip = (req.ip ?? "0.0.0.0").toString();
    const ctx = {
      sessionId: (body.sessionId ?? ip).toString(),
      ip,
      ...(body.history ? { history: body.history } : {}),
    };

    try {
      for await (const event of this.oge.chat(message, ctx)) {
        send(event);
      }
    } catch {
      send({
        type: "notice",
        message:
          "Something went wrong on our side. Please try again, or reach the team on WhatsApp or the contact page.",
      });
      send({ type: "done" });
    } finally {
      res.end();
    }
  }
}
