import { createFamilyAndAddUser, getAllMyFamilies, joinFamilyByInviteCode } from './family.service.js';
import { asyncHandler } from "../../utils/asyncHandler.js";

const sanitize = (family) => ({
    id: String(family._id),
    familyName: family.name,
    ownerId: family.ownerId,
    invitationCode: family.inviteCode
});

const sanitizeFamilyList = (familyList) => ({
    families: familyList.map(family => ({
        id: String(family._id),
        familyName: family.name,
        ownerId: family.ownerId,
        invitationCode: family.inviteCode,
        members: family.members.map(member => ({
            userId: member.userId,
            role: member.role,
            status: member.status
        }))
    }))
});

export const createFamily = asyncHandler(async (req, res) => {
    const family = await createFamilyAndAddUser(req.validatedBody.familyName, req.user.id);
    res.status(201).json({
        success: true, data: {
            family : sanitize(family)
        }
    });
});

export const listMyFamilies = asyncHandler(async (req, res) => {
    const familyList = await getAllMyFamilies(req.user.id);
    res.status(200).json({
        success: true, 
        data: {
            familyList : sanitizeFamilyList(familyList)
        }
    })
});

export const joinFamily = asyncHandler(async (req, res) => {
    const { inviteCode } = req.validatedBody;
    const family = await joinFamilyByInviteCode(inviteCode, req.user.id);
    res.status(200).json({
        success: true,
        data: {
            family : sanitize(family)
        }
    });
});