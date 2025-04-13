import morgan, { StreamOptions } from 'morgan';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dayjs from 'dayjs';
import { inspect } from 'util';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create stream for writing logs to file
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// User token
morgan.token('user', (req: Request) => {
  const user = (req as any).user;
  return user ? `${user.id}` : 'guest';
});

// Response time with color
morgan.token('response-time-colored', (req: Request, res: Response, digits?: string | number | boolean) => {
  const time = (morgan as any)['response-time'](req, res, digits);
  const ms = parseInt(time, 10);
  
  if (ms < 100) return chalk.green(`${time} ms`);
  if (ms < 500) return chalk.yellow(`${time} ms`);
  return chalk.red(`${time} ms`);
});

// Filter sensitive data
const filterSensitiveData = (obj: any): any => {
  const sensitiveFields = ['password', 'token', 'auth', 'secret', 'credential'];
  if (!obj) return obj;
  
  if (typeof obj === 'object') {
    const result: Record<string, any> = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        result[key] = filterSensitiveData(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }
  return obj;
};

// Request body token
morgan.token('req-body', (req: Request) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const safeBody = filterSensitiveData({ ...req.body });
      return JSON.stringify(safeBody, null, 2);
    } catch (e) {
      return '';
    }
  }
  return '';
});

// Response body token (limited size)
morgan.token('res-body', (req: Request, res: Response) => {
  const rawBody = (res as any).body;
  if (rawBody) {
    try {
      const safeBody = filterSensitiveData(rawBody);
      return JSON.stringify(safeBody, null, 2);
    } catch (e) {
      return '';
    }
  }
  return '';
});

// Route token
morgan.token('route', (req: Request) => {
  return req.route ? req.route.path : '';
});

// Enhanced development logger without boxen dependency
const developmentLogger = (tokens: any, req: Request, res: Response) => {
  const status = tokens.status(req, res);
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const responseTime = tokens['response-time'](req, res, 2);
  const contentLength = tokens.res(req, res, 'content-length') || '-';
  const user = tokens.user(req, res);
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');
  
  // Status icon and color
  const statusIcon = status >= 500 ? '❌' : 
                     status >= 400 ? '⚠️' : 
                     status >= 300 ? '↪️' : '✅';
  
  const statusColor = status >= 500 ? chalk.bgRed.white : 
                     status >= 400 ? chalk.bgYellow.black : 
                     status >= 300 ? chalk.bgCyan.black : 
                     chalk.bgGreen.black;
  
  // Method color
  const methodColor = method === 'GET' ? chalk.bgBlue.white :
                    method === 'POST' ? chalk.bgGreen.white :
                    method === 'PUT' ? chalk.bgYellow.black :
                    method === 'DELETE' ? chalk.bgRed.white :
                    chalk.bgGray.white;

  // Header with border
  console.log('\n' + '='.repeat(60));
  console.log(chalk.bold(`⏱️  ${timestamp} ${statusIcon} ${methodColor(` ${method} `)} ${url}`));
  
  // Details
  const details = [
    `${chalk.bold('Status')}: ${statusColor(` ${status} `)}`,
    `${chalk.bold('Response Time')}: ${responseTime >= 500 ? chalk.red(`${responseTime}ms`) : 
                                      responseTime >= 100 ? chalk.yellow(`${responseTime}ms`) : 
                                      chalk.green(`${responseTime}ms`)}`,
    `${chalk.bold('Content Length')}: ${chalk.cyan(contentLength)}`,
    `${chalk.bold('User')}: ${chalk.magenta(user)}`
  ].join(' | ');
  console.log(details);

  // Request body
  const body = tokens['req-body'](req, res);
  if (body) {
    console.log(chalk.bold.underline('📥 Request Body:'));
    console.log(chalk.cyan(body));
  }

  // Response body (if available)
  const resBody = tokens['res-body'](req, res);
  if (resBody) {
    console.log(chalk.bold.underline('📤 Response Body:'));
    console.log(chalk.green(resBody));
  }

  // Headers (selective important ones)
  const importantHeaders = ['content-type', 'authorization', 'user-agent', 'referer'];
  const reqHeaders = Object.keys(req.headers)
    .filter(h => importantHeaders.includes(h.toLowerCase()))
    .map(h => `${chalk.gray(h)}: ${chalk.white(req.headers[h] as string)}`)
    .join('\n  ');
  
  // if (reqHeaders) {
  //   console.log(chalk.bold.underline('🔍 Important Headers:'));
  //   console.log('  ' + reqHeaders);
  // }

  console.log('='.repeat(60));
  return null;
};

// Format for production
const productionFormat = ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :response-time ms :res[content-length] ":referrer" ":user-agent"';

// Logger factory
const logger = () => {
  if (process.env.NODE_ENV === 'development') {
    return morgan(developmentLogger as any);
  } else {
    return morgan(productionFormat, {
      stream: accessLogStream
    });
  }
};

// Access logger that writes all requests to file
const accessLogger = morgan(productionFormat, {
  stream: accessLogStream
});

export { logger, accessLogger };