import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import express from 'express';
import { db } from './services/db';
import dotenv from 'dotenv';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import 'colors';
import 'reflect-metadata';
// import './services/cache';

// resolvers
import { AuthResolver } from './graphql/resolvers/AuthResolver';
import { ProfileResolver } from './graphql/resolvers/ProfileResolver';
import { ProjectManagerResolver } from './graphql/resolvers/ProjectManagerResolver';
import { ProjectResolver } from './graphql/resolvers/ProjectResolver';
import { HiringResolver } from './graphql/resolvers/HiringResolver';
import { JobHuntingResolver } from './graphql/resolvers/JobHuntingResolver';
import { DeveloperResolver } from './graphql/resolvers/DeveloperResolver';
import { SearchResolver } from './graphql/resolvers/SearchResolver';
import { ForumResolver } from './graphql/resolvers/ForumResolver';
import { ReportResolver } from './graphql/resolvers/ReportResolver';
import { NotificationResolver } from './graphql/resolvers/NotificationResolver';
import { MessagesResolver } from './graphql/resolvers/MessagesResolver';
import { ContactsResolver } from './graphql/resolvers/ContactsResolver';

if (process.env.NODE_ENV != 'production') {
	const env = dotenv.config({ path: '.env' });
	if (env.error) {
		throw env.error;
	}
}

const main = async () => {
	db.connect();

	const app = express();

	const PORT = process.env.PORT || 5000;

	const server = new ApolloServer({
		schema: await buildSchema({
			resolvers: [
				AuthResolver,
				ProfileResolver,
				ProjectManagerResolver,
				ProjectResolver,
				HiringResolver,
				JobHuntingResolver,
				DeveloperResolver,
				SearchResolver,
				ForumResolver,
				ReportResolver,
				NotificationResolver,
				MessagesResolver,
				ContactsResolver,
			],
			validate: true,
		}),
		context: ({ req, res }) => ({ req, res }),
		uploads: false,
	});

	const corsOptions = {
		origin: process.env.FRONTEND_URL as string,
		credentials: true,
	};

	server.applyMiddleware({ app, cors: corsOptions });

	app.use(
		ExpressMongoSanitize({
			replaceWith: '_',
		})
	);

	app.listen(PORT, () =>
		console.log(
			`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
				.bold
		)
	);
};

main().catch((err) => {
	console.error(`Error: ${err}`.red);
});
