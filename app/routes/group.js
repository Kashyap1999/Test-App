import { createGroup, getGroups } from "../models/group.server";

console.log("Called js File");


// export async function action({ request }) {
//     console.log("Called this action");
    
//     const formData = await request.formData();
//     const name = formData.get("name");

//     if (!name) {
//         return new Response(JSON.stringify({ error: "Group name is required" }), {
//             status: 400,
//             headers: { "Content-Type": "application/json" },
//         });
//     }

//     try {
//         console.log("Called this action try");
//         const group = await createGroup(name);
//         return new Response(JSON.stringify({ group }), {
//             status: 200,
//             headers: { "Content-Type": "application/json" },
//         });
//     } catch (error) {
//         return new Response(JSON.stringify({ error: error.message }), {
//             status: 500,
//             headers: { "Content-Type": "application/json" },
//         });
//     }
// }

// export async function loader() {
//     const groups = await getGroups();
//     return new Response(JSON.stringify({ groups }), {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//     });
// }


// Action: Handle form submission and save group into database
export async function action({ request }) {
    // const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const name = formData.get("name");
  
    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "Group name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  
    try {
      // Save the group to the database
      const newGroup = await db.groups.create({
        data: {
          name
        },
      });
  
      return new Response(JSON.stringify(newGroup), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Failed to create group", details: error }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }