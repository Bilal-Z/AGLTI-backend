import { ApolloError } from 'apollo-server-express';
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import { Task, Project, ProjectModel } from '../../entities/Project';
import { authorize, protect } from '../../middleware/auth';
import { MyContext } from '../types/MyContext';
import { Types } from 'mongoose';
import { DocumentType } from '@typegoose/typegoose';
import { ProfileModel } from '../../entities/Profile';

@Resolver()
export class DeveloperResolver {
	@Mutation(() => Boolean)
	@UseMiddleware(protect, authorize('MEMBER'))
	async moveTask(
		@Arg('taskId') taskId: string,
		@Arg('column') column: string,
		@Ctx() ctx: MyContext
	): Promise<Boolean> {
		const project = await ProjectModel.findById(ctx.req.project);

		const task = (
			project!.tasks as Task[] as unknown as Types.DocumentArray<
				DocumentType<Project>
			>
		).id(taskId) as unknown as Task;

		if (!task) {
			throw new ApolloError('task not found');
		}

		if (task.dev!.toString() != ctx.req.user!.id.toString()) {
			throw new ApolloError('task does not belong to user');
		}

		if (column === 'COMPLETE') {
			throw new ApolloError('Not Authorized');
		}

		const taskIndex = project!.tasks!.findIndex((t) => t === task);

		project!.tasks![taskIndex].status = column;

		await project!.save();
		return true;
	}

	@Mutation(() => Boolean)
	@UseMiddleware(protect, authorize('MEMBER'))
	async checkCheckListItem(
		@Arg('taskId') taskId: string,
		@Arg('checklistId') checklistId: string,
		@Arg('checkState') checkState: boolean,
		@Ctx() ctx: MyContext
	): Promise<Boolean> {
		const project = await ProjectModel.findById(ctx.req.project);

		const task = (
			project!.tasks as Task[] as unknown as Types.DocumentArray<
				DocumentType<Project>
			>
		).id(taskId) as unknown as Task;

		if (!task) {
			throw new ApolloError('task not found');
		}

		if (task.dev!.toString() != ctx.req.user!.id.toString()) {
			throw new ApolloError('task does not belong to user');
		}

		const taskIndex = project!.tasks!.findIndex((t) => t === task);
		const checkListIndex = project!.tasks![taskIndex].checkList!.findIndex(
			(cl) => cl.id === checklistId
		);

		project!.tasks![taskIndex].checkList![checkListIndex].checked = checkState;

		await project!.save();
		return true;
	}

	@Mutation(() => Boolean)
	@UseMiddleware(protect, authorize('MEMBER'))
	async leaveProject(@Ctx() ctx: MyContext): Promise<Boolean> {
		const project = await ProjectModel.findById(ctx.req.project);
		const profile = await ProfileModel.findOne({ user: ctx.req.user!.id });

		const developer = project!.members!.find(
			(member) => member.dev!.toString() === ctx.req.user!.id.toString()
		);

		if (!developer) {
			throw new ApolloError('user not part of project');
		}

		// if developer did not contribute to project
		if (
			!project!.tasks!.some(
				(task) =>
					task.dev!.toString() === ctx.req.user!.id.toString() &&
					task.status === 'COMPLETE'
			)
		) {
			// remove project from profile
			profile!.projects!.shift();
		} else {
			// add to past members
			project!.previousMembers!.push(developer);
		}

		// remove from members
		project!.members = project!.members!.filter(
			(member) => member != developer
		);
		// unset active project
		profile!.activeProject = undefined;
		// clear project forun mentions
		profile!.mentions = [];

		// remove tasks of dev
		project!.tasks = project!.tasks!.filter(
			(task) =>
				!(
					task.dev!.toString() === ctx.req.user!.id.toString() &&
					task.status != 'COMPLETE'
				)
		);

		await profile!.save();
		await project!.save();
		return true;
	}
}
