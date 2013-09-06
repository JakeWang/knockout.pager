(function (ko) {

    // Template used to render the page links
    var templateEngine = new ko.nativeTemplateEngine();

    templateEngine.addTemplate = function (templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
    };

    templateEngine.addTemplate("ko_pager_links", "\
        <div class='pager' data-bind='if: totalPages() > 1'>\
            <span class='first-page-link'><a class='pager-button icon-fast-backward' data-bind='click: page.bind($data, 1), enable: page() > 1, css: {disabled: page() == 1}'></a></span>\
            <span class='pager-pages' data-bind='foreach: relativePages'>\
                <span class='pager-page'><a class='pager-button' href='#' data-bind='click: $parent.page.bind($parent, $data), text: $data, css: { selected: $parent.page() == $data }'></a></span>\
            </span>\
            <span class='last-page-link'><a class='pager-button icon-fast-forward' data-bind='click: page.bind($data, totalPages()), enable: page() < totalPages(), css: { disabled: page() == totalPages() }'></a></span>\
        </div>\
    ");

    templateEngine.addTemplate("ko_pager_size", "\
            <select class='pageSizeControl' data-bind='value: itemsPerPage, enable: allowChangePageSize'>\
                <option>10</option>\
                <option>25</option>\
                <option>50</option>\
                <option>100</option>\
            </select>\
    ");

    function makeTemplateValueAccessor(pager) {
        return function () {
            return { 'foreach': pager.pagedItems, 'templateEngine': templateEngine };
        };
    }
    
    function defaultPagerIfEmpty(observable) {
        if (!observable.pager) observable.pager = new ko.bindingHandlers.pagedForeach.Pager(observable);
    }

    function checkItemPerPageBinding(allBindings, pager){
        if (allBindings['pageSize']) {
            pager.itemsPerPage(ko.utils.unwrapObservable(allBindings['pageSize']));
                
            if (ko.isObservable(allBindings['pageSize'])) {
                allBindings['pageSize'].subscribe(function (newVal) {
                    pager.itemsPerPage(newVal);
                });
                pager.itemsPerPage.subscribe(function (newVal) {
                    allBindings['pageSize'](newVal);
                });
            }
        }
    }

    ko.bindingHandlers.pagedForeach = {
        Pager : function (observableArray){
            var self = this;

            self.page = ko.observable(1);

            self.itemsPerPage = ko.observable(10);
            self.allowChangePageSize = ko.observable(false);

            self.totalPages = ko.computed(function () {
                var array = ko.utils.unwrapObservable(observableArray);
                return Math.ceil(array.length / self.itemsPerPage());
            });
            self.pagedItems = ko.computed(function () {
                var array = ko.utils.unwrapObservable(observableArray);
                var indexOfFirstItemOnCurrentPage = (((self.page() * 1) - 1) * (self.itemsPerPage() * 1));
                var pageArray = array.slice(indexOfFirstItemOnCurrentPage, indexOfFirstItemOnCurrentPage + (self.itemsPerPage()* 1));
                return pageArray;
            });

            self.relativePages = ko.computed(function () {
                var currentPage = self.page() * 1;
                var totalPages = self.totalPages();
                var pagesFromEnd = totalPages - currentPage;
                var extraPagesAtFront = Math.max(0, 2 - pagesFromEnd);
                var extraPagesAtEnd = Math.max(0, 3 - currentPage);
                var firstPage = Math.max(1, currentPage - (2 + extraPagesAtFront));
                var lastPage = Math.min(self.totalPages(), currentPage + (2 + extraPagesAtEnd));

                return ko.utils.range(firstPage, lastPage);
            });

            if (ko.isObservable(observableArray))
                observableArray.subscribe(function () {
                    self.page(1);
                });

            self.itemsPerPage.subscribe(function () {
                self.page(1);
            });

            self.page.subscribe(function (newVal) {
                var n = (newVal + '').replace(/[^0-9]/g, '');
                if (n < 1) n = 1;
                else if (n > self.totalPages()) n = self.totalPages();
                if (n != newVal) {
                    self.page(n);
                }
            });

            return self;
        },
        init : function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
            var observable = valueAccessor(), allBindings = allBindingsAccessor();
            defaultPagerIfEmpty(observable);
            checkItemPerPageBinding(allBindings, observable.pager);
            var array = ko.utils.unwrapObservable(observable);
            return ko.bindingHandlers.template.init(element, makeTemplateValueAccessor(observable.pager));
        },
        update : function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
            var observable = valueAccessor();
            var array = ko.utils.unwrapObservable(observable);
            defaultPagerIfEmpty(observable);
            return ko.bindingHandlers.template.update(element, makeTemplateValueAccessor(observable.pager), allBindingsAccessor, viewModel, bindingContext);
        }
    };

    ko.bindingHandlers.pageSizeControl = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var observable = valueAccessor(), allBindings = allBindingsAccessor();
            defaultPagerIfEmpty(observable);
            checkItemPerPageBinding(allBindings, observable.pager);
            return { 'controlsDescendantBindings': true };
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var observable = valueAccessor();
            var array = ko.utils.unwrapObservable(observable);
            defaultPagerIfEmpty(observable);
            
            observable.pager.allowChangePageSize(true);
            
            // Empty the element
            while (element.firstChild) ko.removeNode(element.firstChild);

            // Render the page links
            ko.renderTemplate('ko_pager_size', observable.pager, { templateEngine: templateEngine }, element);
        }
    };

    ko.bindingHandlers.pageLinks = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var observable = valueAccessor(), allBindings = allBindingsAccessor();
            defaultPagerIfEmpty(observable);
            checkItemPerPageBinding(allBindings, observable.pager);
            return { 'controlsDescendantBindings': true };
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var observable = valueAccessor();
            var array = ko.utils.unwrapObservable(observable);
            defaultPagerIfEmpty(observable);
            
            // Empty the element
            while (element.firstChild) ko.removeNode(element.firstChild);

            // Render the page links
            ko.renderTemplate('ko_pager_links', observable.pager, { templateEngine: templateEngine }, element, "replaceNode");
        }
    };
}(ko));
