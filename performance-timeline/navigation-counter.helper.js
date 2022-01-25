// The test functions called in the navigation-counter test. They rely on artifacts defined
// in
// '/html/browsers/browsing-the-web/back-forward-cache/resources/helper.sub.js'
// which should be include before this file to use these functions.

function runNavigationCounterTest(params, description) {
  const defaultParams = {
    // This function is to make and obtain the navigation counter value for a
    // performance entries of mark and meature type. It is to be extended for
    // other types of performance entry in future.
    funcBeforeNavigation: () => {
      window.performance.mark('mark_navigation_counter');
      return window.performance.getEntriesByName('mark_navigation_counter')[0].navigationCount;
    },
    funcAfterBFCacheLoad: (expectedNavigationCount) => {
      window.performance.mark('mark_navigation_counter' + expectedNavigationCount);
      window.performance.measure('measure_navigation_counter' + expectedNavigationCount, 'mark_navigation_counter', 'mark_navigation_counter' + expectedNavigationCount);
      return [window.performance.getEntriesByName('mark_navigation_counter' + expectedNavigationCount)[0].navigationCount, window.performance.getEntriesByName('measure_navigation_counter' + expectedNavigationCount)[0].navigationCount];
    },
  }
  params = { ...defaultParams, ...params };
  runBfcacheWithMultipleNavigationTest(params, description);
}

function runBfcacheWithMultipleNavigationTest(params, description) {
  const defaultParams = {
    openFunc: url => window.open(url, '_blank', 'noopener'),
    scripts: [],
    funcBeforeNavigation: () => { },
    targetOrigin: originCrossSite,
    navigationTimes: 1,
    funcAfterAssertion: () => { },
  }
  // Apply defaults.
  params = { ...defaultParams, ...params };

  promise_test(async t => {
    const pageA = new RemoteContext(token());
    const pageB = new RemoteContext(token());

    const urlA = executorPath + pageA.context_id;
    const urlB = params.targetOrigin + executorPath + pageB.context_id;

    params.openFunc(urlA);

    await pageA.execute_script(waitForPageShow);

    // Assert navigation counter is 0 when the document is loaded first time.
    let navigationCount = await pageA.execute_script(params.funcBeforeNavigation)
    assert_implements_optional(navigationCount === 0, "NavigationCount should be 0.");

    for (i = 0; i < params.navigationTimes; i++) {
      await navigateAndThenBack(pageA, pageB, urlB);

      let navigationCounts = await pageA.execute_script(params.funcAfterBFCacheLoad, [i + 1]);
      assert_implements_optional(navigationCounts.every(t => t === (i + 1)), "NavigationCounts should all be " + (i + 1) + ".");
    }
  }, description);
}
