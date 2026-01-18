import * as vscode from 'vscode';
import winston from 'winston';
import path from 'path';

let logger = null;
let outputChannel = null;

/**
 * Custom transport for VS Code output channel
 */
class VSCodeOutputTransport extends winston.Transport {
	constructor(opts = {}) {
		super(opts);
		this.name = 'vscode-output';
	}

	log(info, callback) {
		setImmediate(() => {
			this.emit('logged', info);
		});

		if (outputChannel) {
			const message = info[Symbol.for('message')];
			outputChannel.appendLine(message);
		}

		callback();
	}
}

/**
 * Initialize the logger with VS Code output channel
 * @param {vscode.ExtensionContext} context
 */
export function initializeLogger(context) {
	// Create VS Code output channel
	outputChannel = vscode.window.createOutputChannel('WorkItems Manager');
	
	// Create Winston logger
	logger = winston.createLogger({
		level: 'info',
		format: winston.format.combine(
			winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
			winston.format.errors({ stack: true }),
			winston.format.splat(),
			winston.format.printf(({ level, message, timestamp, stack }) => {
				const msg = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
				return stack ? `${msg}\n${stack}` : msg;
			})
		),
		transports: [
			new VSCodeOutputTransport(),
			// Also log to file in extension's log directory
			new winston.transports.File({
				filename: path.join(context.logUri.fsPath, 'workitems-manager.log'),
				maxsize: 5242880, // 5MB
				maxFiles: 5,
                zippedArchive: true
			})
		]
	});

	// Add dispose handler
	context.subscriptions.push({
		dispose: () => {
			if (outputChannel) {
				outputChannel.dispose();
			}
			if (logger) {
				logger.close();
			}
		}
	});

	logger.info('Logger initialized');
    logger.info(`Log file located at: ${path.join(context.logUri.fsPath, 'workitems-manager.log')}`);
	
	return logger;
}

/**
 * Get the logger instance
 */
export function getLogger() {
	if (!logger) {
		throw new Error('Logger not initialized. Call initializeLogger() first.');
	}
	return logger;
}

/**
 * Show the output channel
 */
export function showOutput() {
	if (outputChannel) {
		outputChannel.show();
	}
}

/**
 * Log convenience methods
 */
export const log = {
	info: (message, ...args) => getLogger().info(message, ...args),
	warn: (message, ...args) => getLogger().warn(message, ...args),
	error: (message, ...args) => getLogger().error(message, ...args),
	debug: (message, ...args) => getLogger().debug(message, ...args),
	show: showOutput
};
