import { createFamilyAndAddUser } from './family.service.js';
import { asyncHandler } from "../../utils/asyncHandler.js";

const sanitize = (family) => ({
    id: String(family._id),
    familyName: family.name,
    ownerId: family.ownerId,
    invitationCode: family.inviteCode
})

export const createFamily = asyncHandler(async (req, res) => {
    const family = await createFamilyAndAddUser(req.validatedBody.familyName, req.user.id);
    res.status(201).json({
        success: true, data: {
            family : sanitize(family)
        }
    });
});