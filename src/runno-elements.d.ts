import type * as React from "react"

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"runno-run": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement>,
				HTMLElement
			> & {
				runtime?: string
			}
		}
	}
}
