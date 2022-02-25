import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class RocketRollCommand implements ISlashCommand {
    public command = 'roll';
    public i18nParamsExample = 'ROCKETROLL_Command_Params';
    public i18nDescription = 'ROCKETROLL_Command_Description';
    public providesPreview = false;

    public DEFAULT_AVATAR = "https://raw.githubusercontent.com/simonerota/rocketchat-rocketroll/master/assets/generic/default.png"

    public BallAnswers = ['It is certain', 'It is decidedly so', 'Without a doubt', 'Yes definitely', 'You may rely on it', 'As I see it, yes', 'Most likely', 'Outlook good', 'Yes', 'Signs point to yes', 'Reply hazy, try again', 'Ask again later', 'Better not tell you now', 'Cannot predict now', 'Concentrate and ask again', 'Don\'t count on it', 'My reply is no', 'My sources say no', 'Outlook not so good', 'Very doubtful'];

    // tslint:disable-next-line:max-line-length
    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {

        if (context.getArguments().length == 0) {
            return await this.handleNumberRoll(context, read, modify);
        }

        const option = context.getArguments()[0];
        switch (option) {
            case "d6":
            case "d20":
                return await this.handleDiceRoll(context, read, modify, option);
            case "coin":
                return await this.handleCoinRoll(context, read, modify);
            case "blame":
                return await this.handleBlameRoll(context, read, modify, persis);
            case "8ball":
                if (context.getArguments().length < 2) {
                    return await this.handleWrongParams(context, read, modify);
                }
                return await this.handle8BallRoll(context, read, modify);
            default:
                return await this.handleWrongParams(context, read, modify);
        }
    }

    private async handleNumberRoll(context: SlashCommandContext, read: IRead, modify: IModify): Promise<void> {

        const random = Math.floor(Math.random()*(100)) + 1;
        const messageText = `@${context.getSender().username} rolls *${random}* (1-100)`;

        return await this.sendMessage(context, modify, messageText, this.DEFAULT_AVATAR);

    }

    private async handleCoinRoll(context: SlashCommandContext, read: IRead, modify: IModify): Promise<void> {

        const random = Math.floor(Math.random()*(2)) + 1;
        const face = random === 1 ? 'head' : 'tail';
        const avatar = `https://raw.githubusercontent.com/simonerota/rocketchat-rocketroll/master/assets/coin/${face}.png`;

        const messageText = `@${context.getSender().username} flips a coin... *${face}*!`;

        return await this.sendMessage(context, modify, messageText, avatar);

    }

    private async handleDiceRoll(context: SlashCommandContext, read: IRead, modify: IModify, mode: string): Promise<void> {

        const faces = (mode === "d6" ? 6 : 20);

        const random = Math.floor(Math.random()*(faces)) + 1;
        const avatar = `https://raw.githubusercontent.com/simonerota/rocketchat-rocketroll/master/assets/${mode}/d${random}.png`;

        const messageText = `@${context.getSender().username} rolls *${random}*`;

        return await this.sendMessage(context, modify, messageText, avatar);

    }

    private async handleBlameRoll(context: SlashCommandContext, read: IRead, modify: IModify, persis: IPersistence): Promise<void> {

        const members = await read.getRoomReader().getMembers(context.getRoom().id);
        const who = members[Math.floor(Math.random() * members.length)];

        const messageText = `Everybody looks at @${who.username}`;

        return await this.sendMessage(context, modify, messageText, this.DEFAULT_AVATAR);

    }

    private async handle8BallRoll(context: SlashCommandContext, read: IRead, modify: IModify): Promise<void> {

        const random = Math.floor(Math.random() * 20);
        const answer = this.BallAnswers[random];
        const question = context.getArguments().join(' ').substring(6);

        let icon = 'yes';
        if (random > 9) {icon = 'unsure'};
        if (random > 14) {icon = 'no'};

        const avatar = `https://raw.githubusercontent.com/simonerota/rocketchat-rocketroll/master/assets/8ball/${icon}.png`;

        const messageText = `@${context.getSender().username} asks: _${question}_\nThe mighty ball replies: *${answer}*`;

        return await this.sendMessage(context, modify, messageText, avatar);

    }

    private async handleWrongParams(context: SlashCommandContext, read: IRead, modify: IModify): Promise<void> {

        const msg = modify.getCreator().startMessage().setText("Wrong command: use _/roll_ or _/roll d6|d20|blame|coin_ or /roll 8ball Your question")
            .setRoom(context.getRoom()).getMessage();

        return await modify.getNotifier().notifyUser(context.getSender(), msg);

    }

    private async sendMessage(context: SlashCommandContext, modify: IModify, text: string, avatar: string): Promise<void> {
        await modify.getCreator().finish(
            modify.getCreator().startMessage().setText(text)
                .setAvatarUrl(avatar)
                .setGroupable(false)
                .setRoom(context.getRoom()));
    }



}
