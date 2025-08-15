import { AuthFastifyRequest, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import jwt from "../../../utils/jwt";
import Ajv from "ajv";
import { User, UserSchema } from "../../../domain/user/schema";
import { Type } from "@sinclair/typebox";
import { isUserExistByEmail } from "../../../domain/user/repository";
import { ErrorFactory, normalizeError } from "../../../utils/errors";

// JWT payload schema
const JWTPayloadSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.String(),
  iat: Type.Optional(Type.Number()),
  exp: Type.Optional(Type.Number()),
});

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
});

const authPlugin: FastifyPluginAsync = async (server) => {
  server.decorate(
    "requireAuth",
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        // Extract the token from the Authorization header
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw ErrorFactory.tokenMissing();
        }

        const token = authHeader.substring(7, authHeader.length);

        // Verify the token
        let decoded: any;
        try {
          decoded = jwt.verify(token);
        } catch (jwtError) {
          throw ErrorFactory.tokenInvalid({
            reason: jwtError instanceof Error ? jwtError.message : 'Token verification failed'
          });
        }

        // Validate the decoded token payload
        const validate = ajv.compile(JWTPayloadSchema);
        const valid = validate(decoded);

        if (!valid) {
          throw ErrorFactory.tokenInvalid({
            reason: 'Invalid token payload structure',
            details: validate.errors
          });
        }

        const user = decoded as User;
        
        // Check if user still exists in database
        const userExists = await isUserExistByEmail(user.email);

        if (!userExists) {
          throw ErrorFactory.userNotFound();
        }

        (request as AuthFastifyRequest).user = user;
        (request as AuthFastifyRequest).token = token;

      } catch (error) {
        // Normalize the error and send standardized response
        const appError = normalizeError(error);
        const response = appError.toApiResponse(
          request.id,
          request.url
        );

        return reply.status(appError.statusCode).send(response);
      }
    }
  );
};

declare module "fastify" {
  export interface AuthFastifyRequest extends FastifyRequest {
    user: User;
    token: string;
  }

  export interface FastifyInstance {
    requireAuth: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

export default fp(authPlugin);