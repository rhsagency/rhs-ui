import { OpenSourceCredits, type OpenSourcePackage } from "@rhs-ui/marketing/open-source-credits";

const PACKAGES: readonly OpenSourcePackage[] = [
  { name: "tidepool", version: "4.2.1", license: "MIT", repository: "https://example.com/tidepool" },
  { name: "lantern-router", version: "2.9.0", license: "MIT", repository: "https://example.com/lantern-router" },
  { name: "quillmark", version: "6.1.3", license: "MIT", repository: "https://example.com/quillmark" },
  { name: "polder-forms", version: "3.4.0", license: "MIT", repository: "https://example.com/polder-forms" },
  { name: "stencil-icons", version: "1.18.2", license: "MIT", repository: "https://example.com/stencil-icons" },
  { name: "ember-dates", version: "5.0.7", license: "MIT", repository: "https://example.com/ember-dates" },
  { name: "tinyqueue-js", version: "1.1.0", license: "MIT", repository: "https://example.com/tinyqueue-js" },
  { name: "hushlog", version: "0.9.4", license: "MIT", repository: "https://example.com/hushlog" },
  { name: "driftwood-cache", version: "2.2.0", license: "MIT", repository: "https://example.com/driftwood-cache" },
  { name: "pixelweave", version: "7.3.1", license: "MIT", repository: "https://example.com/pixelweave" },
  { name: "@halcyon/design-tokens", version: "3.1.0", license: "MIT", repository: "https://example.com/halcyon/design-tokens" },
  { name: "@halcyon/focus-trap", version: "1.6.2", license: "MIT", repository: "https://example.com/halcyon/focus-trap" },
  { name: "kestrel-http", version: "8.0.2", license: "Apache-2.0", repository: "https://example.com/kestrel-http" },
  { name: "granite-db", version: "4.7.0", license: "Apache-2.0", repository: "https://example.com/granite-db" },
  { name: "lumen-telemetry", version: "2.5.1", license: "Apache-2.0", repository: "https://example.com/lumen-telemetry" },
  { name: "beacon-auth", version: "1.12.0", license: "Apache-2.0", repository: "https://example.com/beacon-auth" },
  { name: "meridian-queue", version: "3.0.4", license: "Apache-2.0", repository: "https://example.com/meridian-queue" },
  { name: "saltmarsh-crypto", version: "1.4.2", license: "BSD-3-Clause", repository: "https://example.com/saltmarsh-crypto" },
  { name: "tern-parser", version: "2.1.1", license: "BSD-3-Clause", repository: "https://example.com/tern-parser" },
  { name: "willow-diff", version: "0.7.0", license: "BSD-3-Clause", repository: "https://example.com/willow-diff" },
  { name: "cairn-paths", version: "3.0.0", license: "BSD-2-Clause", repository: "https://example.com/cairn-paths" },
  { name: "ledger-lint", version: "5.2.0", license: "ISC", repository: "https://example.com/ledger-lint" },
  { name: "sparrow-glob", version: "9.1.0", license: "ISC", repository: "https://example.com/sparrow-glob" },
  { name: "reed-yaml", version: "2.3.3", license: "ISC", repository: "https://example.com/reed-yaml" },
  { name: "marlin-pdf", version: "1.9.0", license: "MPL-2.0", repository: "https://example.com/marlin-pdf" },
  { name: "gannet-hash", version: "0.5.6", license: "MIT OR Apache-2.0", repository: "https://example.com/gannet-hash" },
  { name: "tiny-uuid", version: "1.0.0", license: "0BSD" },
];

const MIT = `MIT License

Copyright (c) <year> <copyright holders>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

// Apache-2.0 asks for the complete licence. The standard notice stands in for it in this demo; ship the full text from apache.org.
const APACHE = `Apache License, Version 2.0

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`;

const BSD_DISCLAIMER = `THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;

const BSD_2 = `BSD 2-Clause License

Copyright (c) <year>, <copyright holder>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

${BSD_DISCLAIMER}`;

const BSD_3 = `BSD 3-Clause License

Copyright (c) <year>, <copyright holder>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

${BSD_DISCLAIMER}`;

const ISC = `ISC License

Copyright (c) <year>, <copyright holders>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:py-16">
      <OpenSourceCredits
        title="Open source credits"
        description="Northwind stands on the work of the people who wrote the libraries below. Select a licence to read its full text."
        caption="Open source software shipped in Northwind"
        packages={PACKAGES}
        licenseTexts={{ MIT, "Apache-2.0": APACHE, "BSD-3-Clause": BSD_3, "BSD-2-Clause": BSD_2, ISC }}
      />

      <div className="mt-24 border-t border-border pt-12">
        <p className="mb-8 text-xs text-muted-foreground">A short list needs no search, and a licence without a supplied text is shown as plain words</p>
        <OpenSourceCredits
          headingLevel={3}
          title="In the Halcyon mobile app"
          searchable={false}
          packages={[
            { name: "stencil-icons", version: "1.18.2", license: "MIT", repository: "https://example.com/stencil-icons" },
            { name: "ember-dates", version: "5.0.7", license: "MIT", repository: "https://example.com/ember-dates" },
            { name: "kestrel-http", version: "8.0.2", license: "Apache-2.0", repository: "https://example.com/kestrel-http" },
            { name: "marlin-pdf", version: "1.9.0", license: "MPL-2.0", repository: "https://example.com/marlin-pdf" },
          ]}
          licenseTexts={{ MIT }}
        />
      </div>
    </div>
  );
}
