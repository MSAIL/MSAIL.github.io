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
              className="group flex items-center gap-4 border-b border-border py-5 transition-colors hover:bg-paper-deep"
            >
              <ChannelIcon
                name={c.key}
                className="h-6 w-6 shrink-0 text-muted transition-colors duration-200 group-hover:text-ink"
              />
              <span className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                <span className="font-display text-h3 text-ink">{c.label}</span>
                <span className="font-mono text-meta text-faint">{c.value}</span>
              </span>
              <ArrowIcon className="h-5 w-5 shrink-0 -rotate-45 text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
