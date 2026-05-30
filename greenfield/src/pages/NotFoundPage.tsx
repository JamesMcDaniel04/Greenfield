import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <section className="container-narrow py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">404</p>
      <h1 className="mt-2 font-display text-4xl">Off the trail.</h1>
      <p className="mt-2 text-muted-foreground">This page hasn't been built yet.</p>
      <Button asChild className="mt-6"><Link to="/career">Back to the track</Link></Button>
    </section>
  );
}
