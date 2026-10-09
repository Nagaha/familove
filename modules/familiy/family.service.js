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
    console.log('error1')
    return family;
}