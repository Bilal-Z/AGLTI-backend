import { ObjectType, Field, ID } from 'type-graphql';
import { prop, getModelForClass, Ref } from '@typegoose/typegoose';
import { Project } from './Project';

@ObjectType()
export class Position {
	@Field(() => ID)
	id!: string;

	@Field()
	@prop({ type: () => Project, ref: () => Project, required: true })
	project!: Ref<Project>;

	@Field()
	@prop({
		trim: true,
		required: [true, 'title is required'],
		minlength: 5,
		maxlength: 75,
	})
	title!: string;

	@Field()
	@prop({ required: [true, 'skill(s) required'] })
	skills!: string[];

	@Field()
	@prop({
		trim: true,
		required: [true, 'description is required'],
		minlength: 15,
		maxlength: 500,
	})
	description!: string;

	@Field()
	@prop({ default: Date.now })
	date?: Date;
}

export const PostionModel = getModelForClass(Position);