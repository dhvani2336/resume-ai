import { Workspace } from '../models/workspaceModel.js';
import { User } from '../models/userModel.js';
import { Analysis } from '../models/analysisModel.js';

export const createWorkspace = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a workspace name.'
      });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      ownerId: req.user.id,
      ownerEmail: req.user.email
    });

    return res.status(201).json({
      success: true,
      workspace
    });
  } catch (error) {
    next(error);
  }
};

export const getUserWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.findByUserId(req.user.id);
    return res.status(200).json({
      success: true,
      workspaces
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceDetails = async (req, res, next) => {
  try {
    const workspaceId = req.params.id;
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found.'
      });
    }

    // Verify membership
    const isMember = workspace.ownerId === req.user.id || workspace.members.some(m => m.userId === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this workspace.'
      });
    }

    const resumes = await Analysis.findByWorkspaceId(workspaceId);

    return res.status(200).json({
      success: true,
      workspace,
      resumes
    });
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const workspaceId = req.params.id;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide the email address of the user to invite.'
      });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found.'
      });
    }

    // Only owner/admin can invite
    const userRole = workspace.members.find(m => m.userId === req.user.id)?.role;
    if (workspace.ownerId !== req.user.id && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only workspace administrators can invite members.'
      });
    }

    // Lookup user in DB
    const invitedUser = await User.findByEmail(email);
    if (!invitedUser) {
      return res.status(404).json({
        success: false,
        error: 'No user registered with that email address. Member must have a ResumeAI account.'
      });
    }

    // Verify not already a member
    if (workspace.members.some(m => m.userId === invitedUser.id)) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this workspace.'
      });
    }

    const updatedWorkspace = await Workspace.addMember(workspaceId, {
      userId: invitedUser.id,
      email: invitedUser.email,
      role: role || 'member'
    });

    return res.status(200).json({
      success: true,
      message: 'Member added to workspace successfully.',
      workspace: updatedWorkspace
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const workspaceId = req.params.id;
    const targetUserId = req.params.userId;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found.'
      });
    }

    // Check permissions (only owner/admin can remove, users can remove themselves)
    const isAdmin = workspace.ownerId === req.user.id || 
                    workspace.members.find(m => m.userId === req.user.id)?.role === 'admin';
    const isSelf = req.user.id === targetUserId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to remove this member.'
      });
    }

    if (workspace.ownerId === targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove the workspace owner.'
      });
    }

    const updatedWorkspace = await Workspace.removeMember(workspaceId, targetUserId);

    return res.status(200).json({
      success: true,
      message: 'Member removed from workspace successfully.',
      workspace: updatedWorkspace
    });
  } catch (error) {
    next(error);
  }
};

export const shareResume = async (req, res, next) => {
  try {
    const workspaceId = req.params.id;
    const { resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a resumeId.'
      });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found.'
      });
    }

    // Verify membership
    const isMember = workspace.ownerId === req.user.id || workspace.members.some(m => m.userId === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this workspace.'
      });
    }

    // Fetch and check resume ownership
    const resume = await Analysis.findById(resumeId);
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found.'
      });
    }

    if (resume.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only share resumes that you own.'
      });
    }

    // Update resume workspace reference
    const updatedResume = await Analysis.updateById(resumeId, { workspaceId });

    return res.status(200).json({
      success: true,
      message: 'Resume shared with workspace successfully.',
      resume: updatedResume
    });
  } catch (error) {
    next(error);
  }
};
