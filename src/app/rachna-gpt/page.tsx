import type { Metadata } from "next";
import { GirihSeam } from "@/components/layout/GirihSeam";
import { ChatPage } from "@/components/rachna-gpt/ChatPage";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "RachnaGPT",
  description: "Ask RachnaGPT about admissions, programmes, departments and campus life at RCET Gujranwala.",
  alternates: { canonical: "/rachna-gpt" },
};

export default function RachnaGptPage() {
  return (
    <>
      <div className="band bg-banner">
        <Container className="pt-6 pb-7">
          <h1 className="text-2xl">RachnaGPT</h1>
          <p className="mt-2 max-w-prose text-on-band-muted">
            Quick answers about admissions, programmes, departments and campus life at RCET.
          </p>
        </Container>
        <GirihSeam />
      </div>
      <Container className="py-6 md:py-8">
        <ChatPage />
      </Container>
    </>
  );
}
