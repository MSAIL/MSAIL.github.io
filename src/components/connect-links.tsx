import { site } from "@/data/site";
import { ArrowIcon } from "./icons";
import { ChannelIcon, channelAriaLabel, channelLinkProps } from "./channel-icon";

/**
 * Every MSAIL channel as a tappable list (Slack, Maize Pages, Instagram,
 * LinkedIn, Email). Surfaced on the join and contact pages; data comes from
 * site.channels.
 */
export function ConnectLinks() {
  return (
    <ul className="mt-10 max-w-prose border-t border-border">
      {site.channels.map((c) => {
        return (
          <li key={c.key}>
            <a
              href={c.href}
              {...channelLinkProps(c)}
              aria-label={channelAriaLabel(c)}
              className="group flex items-center gap-4 border-b border-border py-5 transition-colors duration-150 hover:bg-tile"
            >
              <ChannelIcon
                name={c.key}
                className="h-5 w-5 shrink-0 text-ink-2 transition-colors duration-150 group-hover:text-navy"
              />
              <span className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                <span className="text-h4 text-ink">{c.label}</span>
                <span className="text-meta text-ink-3">{c.value}</span>
              </span>
              <ArrowIcon className="h-4 w-4 shrink-0 -rotate-45 text-ink-3 transition-colors duration-150 group-hover:text-navy" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
