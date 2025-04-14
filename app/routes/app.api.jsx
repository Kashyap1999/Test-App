import db from "../db.server";

export async function loader({ request }) {
  const scriptData = await db.customScripts.findFirst();
  const script = scriptData?.data || "";

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store",
    },
  });
}
