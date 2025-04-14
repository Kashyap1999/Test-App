import { prisma } from "../db.server"; // Ensure prisma is imported

export async function createGroup(name) {
    if (!name) {
        throw new Error("Group name is required");
    }

    return await prisma.group.create({
        data: { name },
    });
}

export async function getGroups() {
    return await prisma.group.findMany();
}
    