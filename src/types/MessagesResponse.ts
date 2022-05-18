import { Links } from './Links';
import { MessageObject } from './MessageObject';
import { SecondLevelDomain } from './SecondLevelDomain';
import { TopLevelDomain } from './TopLevelDomain';

export default interface MessagesResponse {
  links: Links;
  messages: MessageObject[];
  secondLevelDomains?: SecondLevelDomain[];
  topLevelDomains?: TopLevelDomain[];
}
