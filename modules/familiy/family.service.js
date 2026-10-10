import { loadActiveUser } from '../user/user.service.js';
import Family from './family.model.js';
import crypto from 'crypto';

export const createFamilyAndAddUser = async (familyName, ownerId) => {
    
    const ownerUser = await loadActiveUser(ownerId);
    const normalizedName = familyName?.trim();
    const invitationCode = crypto.randomBytes(6).toString("hex").toUpperCase();

    const family = await Family.create({
        name : normalizedName,
        ownerId : ownerUser.id,
        members : [{
            userId: ownerId,
            role: "OWNER",
            status : "ACTIVE"
        }],
        inviteCode : invitationCode,
        isActive : true
    });
    
    return family;
}

export const getAllMyFamilies = async (currentUserId) => {
    const families = await Family.find({
        "members.userId": currentUserId,
        "members.status": "ACTIVE",
        isActive: true
    });
    return families;
}

export const joinFamilyByInviteCode = async (inviteCode, userId) => {
    const family = await Family.findOne({
        inviteCode: inviteCode,
        isActive: true
    });
    if (!family) {
        throw new Error("Family not found");
    }
    
    const existingMember = family.members.find(member => member.userId.toString() === userId.toString());
    if (existingMember) {
        throw new Error("User is already a member of this family");
    }

    const newMember = {
        userId: userId,
        role: "MEMBER",
        status: "ACTIVE"
    };
    
    family.members.push(newMember);
    await family.save();
    return family;
}