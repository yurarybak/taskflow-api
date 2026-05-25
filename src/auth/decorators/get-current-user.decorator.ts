import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type CurrentUser = {
  id: string;
  email: string;
};

export const GetCurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser => {
    const request = context.switchToHttp().getRequest<{ user: CurrentUser }>();

    return request.user;
  },
);
