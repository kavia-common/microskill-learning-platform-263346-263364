export function formatMediaDiagnosticsReport(status, mediaDiag, playbackProbe) {
  const apiBase = (status?.baseUrl) || '';
  const endpoints = {
    video: mediaDiag?.urls?.videoUrl || (apiBase ? `${apiBase.replace(/\/$/, '')}/assets/video/mp4/quick-inbox-zero.mp4` : ''),
    captions: mediaDiag?.urls?.vttUrl || (apiBase ? `${apiBase.replace(/\/$/, '')}/assets/captions/quick-inbox-zero.vtt` : ''),
  };

  const headVideo = mediaDiag?.results?.headVideo || {};
  const getVideo = mediaDiag?.results?.getVideo || {};
  const headVtt = mediaDiag?.results?.headVtt || {};
  const getVtt = mediaDiag?.results?.getVtt || {};

  return {
    apiBase,
    testedSlug: mediaDiag?.slug || 'quick-inbox-zero',
    endpoints,
    requests: {
      video: {
        HEAD: { status: headVideo.status ?? null, contentType: headVideo.contentType || null, ok: !!headVideo.ok, error: headVideo.error || null },
        GET: { status: getVideo.status ?? null, contentType: getVideo.contentType || null, ok: !!getVideo.ok, error: getVideo.error || null },
      },
      captions: {
        HEAD: { status: headVtt.status ?? null, contentType: headVtt.contentType || null, ok: !!headVtt.ok, error: headVtt.error || null },
        GET: { status: getVtt.status ?? null, contentType: getVtt.contentType || null, ok: !!getVtt.ok, error: getVtt.error || null },
      },
    },
    validations: {
      videoOk: !!mediaDiag?.assertions?.videoOk,
      vttOk: !!mediaDiag?.assertions?.vttOk,
      expected: {
        videoContentType: 'video/mp4',
        vttContentTypePrefix: 'text/vtt',
      },
    },
    playbackProbe: {
      ok: !!playbackProbe?.ok,
      canPlay: !!playbackProbe?.canPlay,
      error: playbackProbe?.error || null,
    },
  };
}
